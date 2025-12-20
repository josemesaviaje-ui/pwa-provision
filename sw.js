const CACHE_NAME = "provisiones-pwa-v1";

const FILES_TO_CACHE = [
  "index.html",
  "clientes.html",
  "cliente.html",
  "informes.html",

  "manifest.json",

  "css/main.css",

  "js/storage.js",
  "js/clientes.js",
  "js/condiciones.js",
  "js/dashboard.js",
  "js/informes.js",
  "js/exportExcel.js",
  "js/exportPdf.js",
  "js/navigation.js",
  "js/theme.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});