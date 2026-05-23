const CACHE_NAME = 'milion-plechovek-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logo.png',
  './can-marker.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalace - cachování souborů
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktivace - vyčištění staré cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch - strategie "Cache First" pro rychlost, pak Network
self.addEventListener('fetch', (event) => {
  // Ignorujeme požadavky, které nejsou typu GET (např. POST pro zápis do databáze)
  // a také jakékoliv dotazy na Supabase databázi. Ty se musí posílat rovnou na síť.
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return; // Nechá prohlížeč vyřídit požadavek běžnou síťovou cestou bez zásahu Service Workeru
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
