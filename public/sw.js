const CACHE_NAME = 'dzchat-v7';
const STATIC_ASSETS = ['/', '/catalog', '/dzchat'];
const ICON = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dce22ed0-7e15-4a0f-84c3-9987477dea5a.jpg";
const API = "https://functions.poehali.dev/608c7976-816a-4e3e-b374-5dd617b045bf";

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  if (url.hostname === 'functions.poehali.dev' || url.hostname === 'mc.yandex.ru' || request.method !== 'GET') return;
  e.respondWith(
    fetch(request)
      .then(r => {
        if (r.ok && ['document','script','style','font'].includes(request.destination)) {
          caches.open(CACHE_NAME).then(c => c.put(request, r.clone()));
        }
        return r;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
  );
});

// ── Состояние polling ─────────────────────────────────────────────────────────
let pollToken = null;
let pollInterval = null;
let prevUnread = {};
let initialized = false;

function notifyClients(type, data) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients =>
    clients.forEach(c => c.postMessage({ type, ...data }))
  );
}

async function updateBadge(n) {
  try {
    if ('setAppBadge' in self.navigator) {
      n > 0 ? await self.navigator.setAppBadge(n) : await self.navigator.clearAppBadge();
    }
  } catch(_) {}
}

async function pollChats() {
  if (!pollToken) return;
  try {
    const res = await fetch(`${API}?action=chats`, { headers: { 'X-Session-Token': pollToken } });
    if (!res.ok) { if (res.status === 401) stopPolling(); return; }
    const chats = await res.json();
    if (!Array.isArray(chats)) return;

    const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);
    updateBadge(totalUnread);

    if (!initialized) {
      chats.forEach(c => { prevUnread[c.id] = c.unread; });
      initialized = true;
      return;
    }

    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const dzchatVisible = allClients.some(c => c.url.includes('/dzchat') && c.visibilityState === 'visible');

    for (const chat of chats) {
      const prev = prevUnread[chat.id] ?? 0;
      if (chat.unread > prev && chat.last_message) {
        const lm = chat.last_message;
        const body = lm.voice_url ? '🎤 Голосовое'
                   : lm.video_url ? '🎥 Видео'
                   : lm.photo_url ? '📷 Фото'
                   : (lm.text || 'Новое сообщение');

        notifyClients('PLAY_SOUND', {});

        if (!dzchatVisible) {
          try {
            await self.registration.showNotification(chat.name || 'DzChat', {
              body,
              icon: ICON,
              badge: ICON,
              vibrate: [200, 100, 200],
              tag: `msg-${chat.id}`,
              renotify: true,
              silent: false,
              data: { chatId: chat.id, url: '/dzchat' }
            });
          } catch(_) {}
        }
      }
      prevUnread[chat.id] = chat.unread;
    }

    notifyClients('POLL_CALLS', {});
  } catch(_) {}
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  initialized = false;
  prevUnread = {};
  pollInterval = setInterval(pollChats, 3000);
  pollChats();
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
  pollToken = null;
  initialized = false;
  updateBadge(0);
}

// ── Сообщения от страницы ─────────────────────────────────────────────────────
self.addEventListener('message', e => {
  const msg = e.data || {};

  if (msg.type === 'SET_TOKEN') {
    pollToken = msg.token;
    msg.token ? startPolling() : stopPolling();
  }
  if (msg.type === 'LOGOUT') stopPolling();
  if (msg.type === 'CLEAR_BADGE') updateBadge(0);

  // Запрос на оформление Web Push подписки от страницы
  if (msg.type === 'SUBSCRIBE_PUSH' && msg.vapidPublicKey && msg.token) {
    self.registration.pushManager.getSubscription().then(existing => {
      if (existing) {
        // Уже подписаны — просто сохраняем на сервер
        return savePushSubscription(existing, msg.token);
      }
      // Подписываемся
      const key = urlBase64ToUint8Array(msg.vapidPublicKey);
      return self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      }).then(sub => savePushSubscription(sub, msg.token));
    }).catch(() => {});
  }
});

async function savePushSubscription(subscription, token) {
  try {
    const sub = subscription.toJSON();
    await fetch(`${API}?action=push_subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': token },
      body: JSON.stringify({
        subscription: sub,
        user_agent: self.navigator?.userAgent || '',
      }),
    });
  } catch(_) {}
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── Обновление push-подписки когда она протухает (Android Chrome) ────────────
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    (async () => {
      const token = pollToken;
      if (!token) return;
      try {
        const newSub = await self.registration.pushManager.subscribe(
          e.oldSubscription?.options || { userVisibleOnly: true }
        );
        await savePushSubscription(newSub, token);
      } catch (_) { /* ignore */ }
    })()
  );
});

// ── Клик по уведомлению ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data?.url) || '/dzchat';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/dzchat') && 'focus' in c) { c.focus(); return; }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ── Входящий Web Push (когда страница закрыта) ────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'DzChat', body: 'Новое сообщение' };
  if (e.data) {
    try { data = { ...data, ...e.data.json() }; }
    catch(_) { data.body = e.data.text(); }
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: ICON,
      badge: ICON,
      vibrate: [200, 100, 200],
      tag: `dzchat-push-${data.chat_id || 'new'}`,
      renotify: true,
      silent: false,
      data: { url: data.url || '/dzchat', chatId: data.chat_id }
    })
  );
});