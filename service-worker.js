// service-worker.js

const CACHE_NAME = 'drawy-scanner-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  // Agrega otras rutas de archivos necesarios
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
