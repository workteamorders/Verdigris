// Offline fallback only. It caches the /offline/ page and serves it when a page navigation fails. It caches nothing else,
// so it can never serve stale chain data or an old copy of the site.
const OFFLINE = '/offline/';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('verdigris-offline-v1').then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE).then((r) => r || Response.error())));
});
