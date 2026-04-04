const CACHE_NAME = 'skypka24-v1';
const STATIC_ASSETS = [
  '/',
  '/catalog',
];

// Устанавливаем SW и кэшируем статику
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Удаляем старые кэши при активации
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Стратегия: сеть сначала, кэш как fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Не кэшируем API-запросы и внешние ресурсы
  if (
    url.hostname === 'functions.poehali.dev' ||
    url.hostname === 'mc.yandex.ru' ||
    request.method !== 'GET'
  ) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Кэшируем успешные ответы на HTML/JS/CSS
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
