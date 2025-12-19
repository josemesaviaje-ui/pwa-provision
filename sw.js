// sw.js - Versión desactivada temporalmente para forzar carga fresca

// No hace nada - permite que la app cargue siempre la versión nueva
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

// No cachea nada - siempre va a la red
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});