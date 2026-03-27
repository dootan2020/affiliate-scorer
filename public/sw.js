// Minimal service worker for PWA installability
// Network-first for API, cache-first for static assets

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Skip API requests — always fresh
  if (event.request.url.includes('/api/')) return;

  // Skip navigation requests — let Next.js server handle page routing
  if (event.request.mode === 'navigate') return;

  // Cache-first for static assets only (JS, CSS, images, fonts)
  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ico)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
