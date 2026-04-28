const CACHE_NAME = 'staff-v1';
const STATIC_ASSETS = ['/staff'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS).catch(() => {})));
  self.skipWaiting();
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
