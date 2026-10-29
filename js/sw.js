// Service worker: makes the converter installable and usable offline.
// Fonts (only the slices a student has used) and icons are served from the
// cache once fetched. The page, scripts and styles are fetched from the
// network first (so a new deploy is picked up at once) and fall back to the
// cache when offline.
const CACHE = 'tth-v2';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/css/style.css',
  '/css/fonts.css',
  '/js/app.js',
  '/js/engine.js',
  '/js/papers.js',
  '/js/fonts.js',
  '/js/export.js',
  '/js/import.js',
  '/js/languages.js',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      })),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request.mode === 'navigate' ? '/' : request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request.mode === 'navigate' ? '/' : request, { ignoreSearch: true })),
  );
});
