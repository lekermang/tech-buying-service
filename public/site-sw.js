const CACHE = 'site-v1';
const PRECACHE = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE && k.startsWith('site-')).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first для документов, cache-first для статики
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Не трогаем API и метрики
  if (url.hostname === 'functions.poehali.dev' || url.hostname.includes('mc.yandex')) return;
  // /staff имеет свой SW
  if (url.pathname.startsWith('/staff')) return;

  if (request.destination === 'document') {
    e.respondWith(
      fetch(request)
        .then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(request, r.clone()));
          return r;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
    );
    return;
  }

  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(request, r.clone()));
          return r;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
