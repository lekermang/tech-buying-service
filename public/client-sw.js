/* Service Worker для кабинета клиента /client.
   Web Push: показывает уведомления о статусах ремонта, ответах на предложения и т.д. */

const CACHE_NAME = 'client-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME && k.startsWith('client-')).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Push-уведомления от бэкенда client-cabinet
self.addEventListener('push', (event) => {
  let data = { title: 'Скупка 24', body: 'Новое уведомление', url: '/client' };
  try {
    if (event.data) {
      const raw = event.data.text();
      try {
        data = { ...data, ...JSON.parse(raw) };
      } catch {
        data.body = raw;
      }
    }
  } catch {}
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'skupka24-client',
    renotify: true,
    data: { url: data.url || '/client' },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/client';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => {
      for (const c of cl) {
        const u = new URL(c.url);
        if (u.pathname.startsWith('/client')) {
          c.focus();
          c.navigate(url).catch(() => {});
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
