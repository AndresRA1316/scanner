const CACHE_NAME = 'simple-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/CSS/styles.css',
  '/assets/js/avanzado.js',
  '/assets/plugins/scanapp.min.js',
  '/registerpwa.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/icon-144x144.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
