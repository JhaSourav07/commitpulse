// public/service-worker.js

// This is a dummy service worker to prevent 404 console errors.
// It forces the browser to unregister any lingering service workers
// until full PWA support is actively built into the application.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      })
      .then(() => {
        self.clients.claim();
      })
  );
});
