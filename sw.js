const CACHE_NAME = 'manjur-laundry-v60';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './style.css?v=10',
  './main.js',
  './main.js?v=6.0',
  './laporan.js',
  './laporan.js?v=6.0',
  './app.js',
  './manifest.json',
  './logo_manjur.png',
  './xlsx.full.min.js',
  './database_recovered.js',
  './database_recovered.js?v=6.0'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname.includes('script.google.com') || url.hostname.includes('script.googleusercontent.com')) {
    return;
  }

  // Network-first with cache fallback so updates to JS/HTML/DB are always live immediately
  event.respondWith(
    fetch(event.request).then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
