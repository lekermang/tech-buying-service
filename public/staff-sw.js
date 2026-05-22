const CACHE_NAME = 'staff-v3';
const STATIC_ASSETS = ['/staff'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS).catch(() => {})));
  // Не скипаем автоматически — страница покажет баннер «доступно обновление»
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('staff-')).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  if (url.hostname === 'functions.poehali.dev' || url.hostname === 'mc.yandex.ru' || request.method !== 'GET') return;
  if (!url.pathname.startsWith('/staff') && !['script','style','font','image'].includes(request.destination)) return;
  e.respondWith(
    fetch(request)
      .then(r => {
        if (r.ok && ['document','script','style','font'].includes(request.destination)) {
          caches.open(CACHE_NAME).then(c => c.put(request, r.clone()));
        }
        return r;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/staff')))
  );
});

// === PUSH-уведомления ===
self.addEventListener('push', (event) => {
  let data = { title: 'Скупка 24', body: 'Новое уведомление', url: '/staff' };
  try {
    if (event.data) {
      const raw = event.data.text();
      try { data = { ...data, ...JSON.parse(raw) }; } catch { data.body = raw; }
    }
  } catch {}
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'skupka24',
    renotify: true,
    data: { url: data.url || '/staff' },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Клик по уведомлению — открыть/сфокусировать /staff
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/staff';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      for (const c of cls) {
        if (c.url.includes('/staff')) {
          c.focus();
          if (c.navigate) c.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});