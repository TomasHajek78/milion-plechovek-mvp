const CACHE_NAME = 'milion-plechovek-v50';

// Soubory aplikace – načítáme vždy ze sítě (network-first)
const APP_FILES = [
  'app.js',
  'app.html',
  'index.html',
  'style.css',
  'sw.js',
  'manifest.json'
];

// Statické assety – cachujeme pro rychlost a offline (cache-first)
const STATIC_ASSETS = [
  './logo.png',
  './can-marker.png',
  './can-marker-transparent.png',
  './can_marker_green_transparent.png',
  './can_marker_teal_transparent.png',
  './can_marker_red_transparent.png',
  './ikona_sheet2_8.png',
  './ikona_sheet2_9.png',
  './ikona_sheet2_13.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
];

// Instalace – okamžitá aktivace
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch((err) => console.warn('Cache assets warning:', err))
  );
});

// Aktivace – převzetí kontroly a okamžité smazání staré cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
    ])
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Supabase REST a Realtime – ignorovat v SW (vždy přímo na síť)
  if (url.hostname.includes('supabase.co')) return;

  // Soubory aplikace (app.js, app.html, index.html, style.css) – NETWORK FIRST
  const isAppFile = APP_FILES.some((f) => url.pathname.endsWith(f) || url.pathname === '/' || url.pathname === '');
  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('app.html');
        })
    );
    return;
  }

  // Statické assety – CACHE FIRST
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
