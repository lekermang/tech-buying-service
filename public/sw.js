const CACHE_NAME = 'dzchat-v4';
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

// ── Отправка звука клиентам ───────────────────────────────────────
function notifyClients(type, extra) {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(c => c.postMessage({ type, ...extra }));
  });
}

// ── Badge API — количество непрочитанных на иконке приложения ─────
async function updateBadge(totalUnread) {
  try {
    if ('setAppBadge' in self.navigator) {
      if (totalUnread > 0) {
        await self.navigator.setAppBadge(totalUnread);
      } else {
        await self.navigator.clearAppBadge();
      }
    }
  } catch(_e) {}
}

async function pollChats() {
  if (!pollToken) return;
  try {
    const res = await fetch(`${API}?action=chats`, {
      headers: { 'X-Session-Token': pollToken }
    });
    if (!res.ok) { if (res.status === 401) stopPolling(); return; }
    const chats = await res.json();
    if (!Array.isArray(chats)) return;

    // Считаем суммарный unread для Badge
    const totalUnread = chats.reduce((sum, c) => sum + (c.unread || 0), 0);
    updateBadge(totalUnread);

    // Первый цикл — только запоминаем счётчики, не шлём уведомления
    if (!initialized) {
      chats.forEach(c => { prevUnread[c.id] = c.unread; });
      initialized = true;
      return;
    }

    // Проверяем видимость вкладки DzChat
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const dzchatOpen = allClients.some(c => c.url.includes('/dzchat'));
    const dzchatVisible = allClients.some(c => c.url.includes('/dzchat') && c.visibilityState === 'visible');

    for (const chat of chats) {
      const prev = prevUnread[chat.id] ?? 0;
      if (chat.unread > prev && chat.last_message) {
        const lm = chat.last_message;
        const msgText = lm.voice_url ? '🎤 Голосовое'
                      : lm.video_url ? '🎥 Видео'
                      : lm.photo_url ? '📷 Фото'
                      : (lm.text || 'Новое сообщение');
        // Имя отправителя — для групп из sender_name, для личных — имя чата
        const body = msgText;

        // Звук — если вкладка открыта (пусть даже скрыта)
        if (dzchatOpen) {
          notifyClients('PLAY_SOUND', {});
        }

        // Показываем уведомление только если DzChat НЕ виден
        if (!dzchatVisible) {
          try {
            await self.registration.showNotification(chat.name, {
              body,
              icon: ICON,
              badge: ICON,
              vibrate: [150, 80, 150, 80, 150],
              tag: `dzchat-${chat.id}`,
              renotify: true,
              silent: false, // iOS нужен звук из системы
              data: { url: '/dzchat', chatId: chat.id }
            });
          } catch(_e) {
            // Уведомления заблокированы — хотя бы звук через клиент
            notifyClients('PLAY_SOUND', {});
          }
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
  pollInterval = setInterval(pollChats, 3000);
  pollChats(); // сразу
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
  pollToken = null;
  initialized = false;
  updateBadge(0);
}

// ── СООБЩЕНИЯ ОТ ФРОНТЕНДА ───────────────────────────────────────
self.addEventListener('message', (event) => {
  const msg = event.data || {};

  if (msg.type === 'SET_TOKEN') {
    pollToken = msg.token;
    if (msg.token) {
      startPolling();
    } else {
      stopPolling();
    }
  }

  if (msg.type === 'LOGOUT') {
    stopPolling();
  }

  // Фронт сообщает что открыл чат — сбрасываем badge
  if (msg.type === 'CLEAR_BADGE') {
    updateBadge(0);
  }

  if (msg.type === 'NOTIF_PERM') {
    // игнорируем, просто логируем
  }
});

// ── КЛИК ПО УВЕДОМЛЕНИЮ ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/dzchat') && 'focus' in c) {
          c.focus();
          return;
        }
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
      silent: false,
      data: { url: '/dzchat' }
    })
  );
});
