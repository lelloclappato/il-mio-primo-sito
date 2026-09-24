// Rete prima, cache come riserva: gli aggiornamenti arrivano alla prima apertura con internet.
const CACHE = 'abitudini-cache';
// file salvati subito all'installazione, così l'app si apre anche senza connessione
const FILES = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './css/style.css',
  './js/app.js', './js/utili.js', './js/dati.js', './js/calcoli.js', './js/stato.js',
  './js/viste.js', './js/modulo.js', './js/backup.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
