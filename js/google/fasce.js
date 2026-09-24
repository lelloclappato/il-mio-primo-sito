// Calcoli "puri" per Google Calendar: spazi liberi nella giornata e testo del riepilogo.
// Non parlano con Google e non leggono i dati salvati: si possono provare nei test.
import { dateOf } from '../utili.js';
import { scheduled, isDone, serieComplessiva } from '../calcoli.js';

const minuti = ora => { const [h, m] = ora.split(':').map(Number); return h * 60 + m; };
const hhmm = min => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');

// Trasforma un evento dell'API di Google in { inizio, fine, titolo } con i minuti dall'inizio del giorno.
// Gli eventi "tutto il giorno" (compleanni, ferie…) non occupano orari e vengono tenuti a parte.
export function normalizzaEvento(ev, giorno) {
  if (!ev.start || !ev.start.dateTime) return { tuttoIlGiorno: true, titolo: ev.summary || '(senza titolo)' };
  const inizioGiorno = dateOf(giorno).getTime();
  const min = t => Math.round((new Date(t).getTime() - inizioGiorno) / 60000);
  return { inizio: Math.max(0, min(ev.start.dateTime)), fine: Math.min(24 * 60, min(ev.end.dateTime)), titolo: ev.summary || '(senza titolo)' };
}

// Spazi liberi di almeno `durata` minuti tra `da` e `a` (minuti), evitando gli eventi.
// Restituisce [{ inizio: "HH:MM", fine: "HH:MM", minuti }].
export function spaziLiberi(eventi, { da, a, durata }) {
  const occupati = eventi.filter(e => !e.tuttoIlGiorno && e.fine > da && e.inizio < a).sort((x, y) => x.inizio - y.inizio);
  const liberi = [];
  let t = da;
  for (const e of occupati) {
    if (e.inizio - t >= durata) liberi.push([t, e.inizio]);
    t = Math.max(t, e.fine);
  }
  if (a - t >= durata) liberi.push([t, a]);
  return liberi.map(([x, y]) => ({ inizio: hhmm(x), fine: hhmm(y), minuti: y - x }));
}

// Da che ora cercare: adesso arrotondato al quarto d'ora successivo, ma non prima dell'inizio giornata.
export function daQuando(adesso, inizioGiornata) {
  const m = adesso.getHours() * 60 + adesso.getMinutes();
  return Math.max(minuti(inizioGiornata), Math.ceil(m / 15) * 15);
}
export { minuti, hhmm };

// Testo del riepilogo giornaliero da mettere sul calendario "Le mie abitudini".
// null se quel giorno non era prevista nessuna abitudine.
export function riepilogo(d, k, oggi = new Date()) {
  const g = dateOf(k), previste = d.habits.filter(h => scheduled(h, g));
  if (!previste.length) return null;
  const fatte = previste.filter(h => isDone(d, h, k));
  const perfetta = fatte.length === previste.length;
  const serie = serieComplessiva(d, oggi).attuale;
  const righe = previste.map(h => (isDone(d, h, k) ? '✓ ' : '○ ') + h.name);
  const umore = d.journal && d.journal[k] && d.journal[k].mood;
  return {
    titolo: `Abitudini ${fatte.length}/${previste.length}${perfetta ? ' ✓ giornata perfetta' : ''}`,
    descrizione: righe.join('\n') + (serie ? `\n\nSerie: ${serie} ${serie === 1 ? 'giorno' : 'giorni'} di fila` : '')
      + (umore ? `\nUmore: ${umore}/5` : '') + '\n\nAggiornato da Le mie abitudini'
  };
}

// ID dell'evento di riepilogo di un giorno: sempre lo stesso, così si aggiorna invece di duplicarsi.
// Google accetta solo lettere a-v e cifre: "abitudini20260924".
export function idRiepilogo(k) { return 'abitudini' + k.replace(/-/g, ''); }
