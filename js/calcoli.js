// Calcoli sulle abitudini: quando sono previste, se sono completate, serie e percentuali.
// Qui non si disegna nulla: solo numeri. Sarà la parte da coprire con i test.
import { keyOf, addDays, DAYS, DAY_ORDER } from './utili.js';
import { getVal } from './dati.js';

// quanto serve per considerare l'abitudine fatta
export function goal(h) { return h.type === 'check' ? 1 : h.target; }
// 1e-9 evita problemi di arrotondamento (es. 0,1 + 0,2 che non fa esattamente 0,3)
export function isDone(h, k) { return getVal(h.id, k) >= goal(h) - 1e-9; }
// prevista = giorno della settimana scelto E non prima della creazione dell'abitudine
export function scheduled(h, d) { return h.days.includes(d.getDay()) && keyOf(d) >= h.created; }

// Giorni previsti completati di fila, contando all'indietro da oggi.
// I giorni non previsti vengono saltati senza interrompere la serie.
// Se oggi è previsto ma non ancora fatto si parte da ieri: la giornata non è finita.
export function streak(h) {
  let d = new Date(), n = 0;
  if (scheduled(h, d) && !isDone(h, keyOf(d))) d = addDays(d, -1);
  for (let i = 0; i < 800; i++, d = addDays(d, -1)) {
    if (keyOf(d) < h.created) break;
    if (!h.days.includes(d.getDay())) continue;
    if (isDone(h, keyOf(d))) n++; else break;
  }
  return n;
}

// % di giorni previsti completati tra from e to (inclusi); null se nessun giorno previsto
export function rate(h, from, to) {
  let tot = 0, ok = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    if (!scheduled(h, d)) continue;
    tot++; if (isDone(h, keyOf(d))) ok++;
  }
  return tot ? Math.round(ok / tot * 100) : null;
}

// "ogni giorno", "Lun Mer Ven", ...
export function daysLabel(h) {
  if (h.days.length === 7) return 'ogni giorno';
  if (!h.days.length) return 'nessun giorno';
  return DAY_ORDER.filter(d => h.days.includes(d)).map(d => DAYS[d]).join(' ');
}
