const CACHE_NAME = 'dzchat-v3';
const STATIC_ASSETS = ['/', '/catalog', '/dzchat'];
const ICON = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dce22ed0-7e15-4a0f-84c3-9987477dea5a.jpg";
const API = "https://functions.poehali.dev/608c7976-816a-4e3e-b374-5dd617b045bf";

// ── INSTALL / ACTIVATE ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.hostname === 'functions.poehali.dev' || url.hostname === 'mc.yandex.ru' || request.method !== 'GET') return;
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && ['document','script','style','font'].includes(request.destination)) {
          caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
  );
});

// ── СОСТОЯНИЕ ПОЛЛИНГА ────────────────────────────────────────────
let pollToken = null;
let pollInterval = null;
let prevUnread = {}; // { chatId: unreadCount }
let initialized = false;

// Звук через AudioContext внутри SW (работает в некоторых браузерах)
// Основной канал — showNotification с vibrate
function playBeep() {
  try {
    // SW не имеет AudioContext — отправляем сообщение клиентам чтобы сыграли звук
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'PLAY_SOUND' }));
    });
  } catch(_e) {}
}

async function pollChats() {
  if (!pollToken) return;
  try {
    const res = await fetch(`${API}?action=chats`, {
      headers: { 'X-Session-Token': pollToken }
    });
    if (!res.ok) return;
    const chats = await res.json();
    if (!Array.isArray(chats)) return;

    // Первый цикл — только запоминаем счётчики
    if (!initialized) {
      chats.forEach(c => { prevUnread[c.id] = c.unread; });
      initialized = true;
      return;
    }

    // Проверяем нет ли активных клиентов (вкладок) на DzChat
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const dzchatVisible = allClients.some(c => c.url.includes('/dzchat') && c.visibilityState === 'visible');

    for (const chat of chats) {
      const prev = prevUnread[chat.id] ?? 0;
      if (chat.unread > prev && chat.last_message) {
        const lm = chat.last_message;
        const body = lm.voice_url ? '🎤 Голосовое сообщение'
                   : lm.photo_url ? '📷 Фото'
                   : (lm.text || 'Новое сообщение');

        // Звук — отправляем всем открытым вкладкам
        playBeep();

        // Пуш — показываем если DzChat не виден
        if (!dzchatVisible) {
          await self.registration.showNotification(`DzChat — ${chat.name}`, {
            body,
            icon: ICON,
            badge: ICON,
            vibrate: [200, 100, 200],
            tag: `dzchat-${chat.id}`,
            renotify: true,
            silent: false, // системный звук уведомления
            data: { url: '/dzchat', chatId: chat.id }
          });
        }
      }
      prevUnread[chat.id] = chat.unread;
    }
  } catch(_e) {}
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  initialized = false;
  prevUnread = {};
  pollInterval = setInterval(pollChats, 2000); // каждые 2с из SW
  pollChats(); // сразу
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
  pollToken = null;
  initialized = false;
}

// ── СООБЩЕНИЯ ОТ ФРОНТЕНДА ───────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, token } = event.data || {};

  if (type === 'SET_TOKEN') {
    pollToken = token;
    if (token) {
      startPolling();
    } else {
      stopPolling();
    }
  }

  if (type === 'LOGOUT') {
    stopPolling();
  }
});

// ── КЛИК ПО УВЕДОМЛЕНИЮ ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/dzchat') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('/dzchat');
    })
  );
});

// ── ВНЕШНИЙ PUSH (если настроен сервер) ───────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'DzChat', body: 'Новое сообщение' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch(_e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: ICON, badge: ICON,
      vibrate: [200, 100, 200], tag: 'dzchat-push', renotify: true,
      data: { url: '/dzchat' }
    })
  );
});
