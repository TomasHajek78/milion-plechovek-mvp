const CACHE_NAME = 'milion-plechovek-v41';

// Soubory aplikace – načítáme vždy ze sítě (network-first)
// Důvod: při každém deployi musí testeři vidět okamžitě novou verzi
const APP_FILES = ['app.js', 'index.html', 'style.css', 'sw.js'];

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

// Instalace – cachujeme jen statické assety, NE app soubory
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Aktivace – smazat starou cache
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

// Fetch – hybridní strategie
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Supabase – vždy rovnou na síť (data nesmí jít z cache)
  if (url.hostname.includes('supabase.co')) return;

  // Soubory aplikace (app.js, index.html, style.css) – NETWORK FIRST
  // Pokud jsme online, vždy stáhne aktuální verzi a uloží do cache.
  // Pokud jsme offline, použije zálohu z cache.
  const isAppFile = APP_FILES.some((f) => url.pathname.endsWith(f) || url.pathname === '/' || url.pathname === '');
  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Statické assety (obrázky, Leaflet, fonty) – CACHE FIRST pro rychlost
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
