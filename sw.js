// Emergency Service Worker Purger - Unregisters PWA cache on all clients
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.registration.unregister())
     .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Do not intercept any requests, fetch everything fresh from network
  return;
});
