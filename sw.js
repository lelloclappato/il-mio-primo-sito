// Service worker: un piccolo programma che il browser tiene "accanto" all'app.
// Si mette in mezzo tra l'app e internet: ogni volta che l'app chiede un file,
// il service worker decide se prenderlo dalla cache (copia salvata sul telefono) o dalla rete.
// Così l'app si apre anche senza connessione, e si apre subito.
//
// Ciclo di vita:
//  1. install  → scarica tutti i file dell'app e li salva in una cache con il nome della versione
//  2. waiting  → se c'è già una versione vecchia attiva, la nuova aspetta (l'app mostra "Aggiorna")
//  3. activate → la nuova versione prende il controllo e cancella le cache delle versioni vecchie
//
// VERSIONE: durante la pubblicazione su GitHub Pages il workflow sostituisce 'dev' con il codice
// del commit (vedi .github/workflows/deploy-pages.yml). Così a ogni pubblicazione il file sw.js
// cambia, il browser se ne accorge e installa la nuova versione: non serve ricordarsi di cambiarla.
const VERSION = 'dev';
const PREFIX = 'abitudini-';          // tutte le cache di QUESTA app iniziano così
const CACHE = PREFIX + VERSION;
// In sviluppo (sul computer, VERSION = 'dev') si prende sempre tutto dalla rete,
// altrimenti le modifiche ai file non si vedrebbero finché la cache non cambia nome.
const SVILUPPO = VERSION === 'dev';

// file salvati all'installazione: tutto quello che serve per aprire l'app senza connessione
const FILES = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './css/style.css', './fonts/plus-jakarta-sans-latin-variabile.woff2', './fonts/fraunces-latin-600.woff2',
  './js/app.js', './js/utili.js', './js/dati.js', './js/calcoli.js', './js/stato.js',
  './js/viste.js', './js/modulo.js', './js/backup.js', './js/icone.js', './js/migrazione.js',
  './js/validazione.js', './js/pwa.js', './js/promemoria.js', './js/frasi.js'
];

self.addEventListener('install', e => {
  // cache: 'reload' = scarica dalla rete ignorando la cache HTTP del browser, per avere i file nuovi
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  // in sviluppo si attiva subito; in produzione aspetta che l'utente tocchi "Aggiorna"
  if (SVILUPPO) self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Cancella le cache delle versioni vecchie. ATTENZIONE: la memoria delle cache è condivisa
    // con le altre app su lelloclappato.github.io, quindi si toccano solo quelle con il nostro prefisso
    // (più "abitudini-cache", il nome usato dalla versione 1.x).
    for (const k of await caches.keys()) {
      if ((k.startsWith(PREFIX) && k !== CACHE) || k === 'abitudini-cache') await caches.delete(k);
    }
    await self.clients.claim(); // prende subito il controllo delle pagine aperte
  })());
});

// messaggio dall'app: "l'utente ha toccato Aggiorna"
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // solo richieste GET verso il nostro sito: tutto il resto (es. Google in futuro) passa senza toccarlo
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // l'indirizzo principale dell'app (…/ oppure …/index.html, anche con ?parametri) risponde sempre con index.html
  const app = req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname);
  e.respondWith(SVILUPPO ? reteConRiserva(req, app) : cachePrima(req, app));
});

// Tocco su una notifica (promemoria): porta in primo piano l'app se è aperta, altrimenti la apre.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const finestre = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const f of finestre) if ('focus' in f) return f.focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  })());
});

// Produzione: "prima la cache". I file della versione installata rispondono subito, anche offline.
// L'app usa sempre index.html dalla cache, così HTML e JavaScript sono della stessa versione.
async function cachePrima(req, app) {
  const cache = await caches.open(CACHE);
  const trovato = await cache.match(app ? './index.html' : req, { ignoreSearch: app });
  if (trovato) return trovato;
  const r = await fetch(req);                       // file non in elenco: dalla rete...
  if (r.ok) cache.put(req, r.clone());              // ...e se va bene lo si salva per la prossima volta
  return r;
}

// Sviluppo: "prima la rete", la cache solo se manca la connessione.
async function reteConRiserva(req, app) {
  try {
    const r = await fetch(req);
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return r;
  } catch (err) {
    const c = await caches.open(CACHE);
    return (await c.match(req)) || (app && await c.match('./index.html')) || Response.error();
  }
}
