// Promemoria e numero sull'icona dell'app.
//
// LIMITI (spiegati anche nell'app): una web app non può programmare una notifica per un orario
// preciso quando è chiusa, e le notifiche "push" richiedono un server che qui non c'è.
// Quindi il promemoria funziona così:
// - finché l'app è aperta o in sottofondo, un timer scatta all'orario scelto;
// - se a quell'ora mancano abitudini di oggi, mostra una notifica (una sola al giorno).
// Il numero sull'icona (dove il sistema lo supporta) dice quante abitudini mancano oggi.
import { keyOf, todayKey } from './utili.js';
import { data, STORE } from './dati.js';
import { scheduled, isDone } from './calcoli.js';

const ULTIMO = STORE + '-ultimo-promemoria'; // giorno dell'ultima notifica, per non ripeterla
let timer = null;

export function notificheSupportate() { return 'Notification' in window && 'serviceWorker' in navigator; }
export function permesso() { return notificheSupportate() ? Notification.permission : 'non-supportato'; } // 'granted' | 'denied' | 'default'

// chiede il permesso (va chiamata dopo un tocco dell'utente, altrimenti il browser la ignora)
export async function chiediPermesso() {
  if (!notificheSupportate()) return 'non-supportato';
  try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
}

// abitudini previste oggi e non ancora fatte
function mancanti() {
  const oggi = new Date(), k = keyOf(oggi);
  return data.habits.filter(h => scheduled(h, oggi) && !isDone(data, h, k));
}

// Programma il prossimo promemoria di oggi (da richiamare all'avvio, quando si torna
// sull'app e quando cambiano le impostazioni).
export function programma() {
  clearTimeout(timer); timer = null;
  const r = data.settings.reminder;
  if (!r.on || permesso() !== 'granted') return;
  const [hh, mm] = r.time.split(':').map(Number);
  const quando = new Date(); quando.setHours(hh, mm, 0, 0);
  const attesa = quando - Date.now();
  if (attesa <= 0) return;              // l'orario di oggi è già passato
  timer = setTimeout(invia, attesa);
}

async function invia() {
  const lista = mancanti();
  if (!lista.length || localStorage.getItem(ULTIMO) === todayKey()) return;
  const nomi = lista.slice(0, 3).map(h => h.name).join(', ') + (lista.length > 3 ? ` e altre ${lista.length - 3}` : '');
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Le mie abitudini', {
      body: `Ti ${lista.length === 1 ? 'manca' : 'mancano'} ancora: ${nomi}. Hai tempo!`,
      icon: 'icon-192.png', badge: 'icon-192.png',
      tag: 'promemoria',                // una nuova notifica sostituisce la precedente invece di accumularsi
      data: { url: './' }
    });
    localStorage.setItem(ULTIMO, todayKey());
  } catch (e) { /* notifiche non disponibili: pazienza */ }
}

// Numero sull'icona dell'app installata = abitudini che mancano oggi (0 = nessun numero).
export function aggiornaBadge() {
  if (!('setAppBadge' in navigator)) return;
  const n = mancanti().length;
  (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {});
}
