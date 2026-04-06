const CACHE_NAME = 'dzchat-v2';
const STATIC_ASSETS = ['/', '/catalog', '/dzchat'];

const ICON = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dce22ed0-7e15-4a0f-84c3-9987477dea5a.jpg";

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    url.hostname === 'functions.poehali.dev' ||
    url.hostname === 'mc.yandex.ru' ||
    request.method !== 'GET'
  ) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (
          request.destination === 'document' ||
          request.destination === 'script' ||
          request.destination === 'style' ||
          request.destination === 'font'
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
  );
});

// ── PUSH УВЕДОМЛЕНИЯ ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'DzChat', body: 'Новое сообщение', from: '' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch(e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: ICON,
      badge: ICON,
      vibrate: [150, 80, 150],
      tag: 'dzchat-msg',
      renotify: true,
      data: { url: '/dzchat' }
    })
  );
});

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
