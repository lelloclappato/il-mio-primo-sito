// Calcoli sulle abitudini: quando sono previste, se sono completate, serie, percentuali, statistiche.
//
// Qui non si disegna nulla e non si legge nulla dal browser: ogni funzione riceve i dati (d)
// e, dove serve, la data di "oggi". Si chiamano funzioni "pure": a parità di ingresso danno
// sempre lo stesso risultato. Per questo si possono provare con dati inventati (vedi tests/).
import { keyOf, addDays, dateOf, DAYS, DAY_ORDER } from './utili.js';

// Quota di abitudini previste da completare perché un giorno conti nella serie complessiva.
// Si sceglie nella scheda Abitudini ed è salvata in d.settings.soglia: 1 = tutte, 0.8 = circa l'80%.
export const SOGLIE = [1, 0.8];
export function soglia(d) { return d.settings && SOGLIE.includes(d.settings.soglia) ? d.settings.soglia : 1; }

// Quante abitudini servono, su quelle previste, per tenere viva la serie.
// Con l'80% si arrotonda al numero più vicino (almeno 1): con 3 previste ne bastano 2, con 5 ne servono 4.
export function necessarie(previste, s) {
  if (!previste) return 0;
  return s >= 1 ? previste : Math.min(previste, Math.max(1, Math.round(previste * s)));
}

// ---------- singola abitudine ----------

// valore segnato per un'abitudine in un giorno (0 se niente)
export function valore(d, hid, k) { return (d.logs[k] && d.logs[k][hid]) || 0; }
// quanto serve per considerare l'abitudine fatta
export function goal(h) { return h.type === 'check' ? 1 : h.target; }
// 1e-9 evita problemi di arrotondamento (es. 0,1 + 0,2 che non fa esattamente 0,3)
export function isDone(d, h, k) { return valore(d, h.id, k) >= goal(h) - 1e-9; }
// prevista = giorno della settimana scelto E non prima della creazione dell'abitudine
export function scheduled(h, day) { return h.days.includes(day.getDay()) && keyOf(day) >= h.created; }

// ---------- serie ----------
//
// Ogni giorno ha uno di tre "stati":
//   'si' = previsto e completato    → la serie cresce
//   'no' = previsto e non fatto      → la serie si azzera
//   '-'  = non previsto              → si salta, la serie non si interrompe
// Oggi, se non è ancora fatto, vale '-': la giornata non è finita.

// Riceve gli stati dal giorno più vecchio a oggi e restituisce la serie attuale e la migliore.
export function serieDaStati(stati) {
  let run = 0, best = 0;
  for (const s of stati) {
    if (s === 'si') { run++; if (run > best) best = run; }
    else if (s === 'no') run = 0;
  }
  return { attuale: run, migliore: best };
}

export function statoAbitudine(d, h, day, oggiKey) {
  if (!scheduled(h, day)) return '-';
  const k = keyOf(day);
  if (isDone(d, h, k)) return 'si';
  return k === oggiKey ? '-' : 'no';
}

// quante abitudini erano previste in un giorno e quante sono state fatte
export function riepilogoGiorno(d, day) {
  const k = keyOf(day);
  let previste = 0, fatte = 0;
  for (const h of d.habits) if (scheduled(h, day)) { previste++; if (isDone(d, h, k)) fatte++; }
  return { previste, fatte };
}

// stato complessivo di un giorno: 'si' se fatte abbastanza abitudini, secondo la soglia scelta
export function statoGiorno(d, day, oggiKey) {
  const { previste, fatte } = riepilogoGiorno(d, day);
  if (!previste) return '-';
  if (fatte >= necessarie(previste, soglia(d))) return 'si';
  return keyOf(day) === oggiKey ? '-' : 'no';
}

// tutti i giorni da "daKey" a oggi compreso
function giorni(daKey, oggi) {
  const out = [], fine = keyOf(oggi);
  for (let g = dateOf(daKey); keyOf(g) <= fine; g = addDays(g, 1)) out.push(g);
  return out;
}
// data di creazione dell'abitudine più vecchia
function primoGiorno(d) { return d.habits.map(h => h.created).sort()[0]; }

export function serieAbitudine(d, h, oggi = new Date()) {
  const ok = keyOf(oggi);
  return serieDaStati(giorni(h.created, oggi).map(g => statoAbitudine(d, h, g, ok)));
}

export function serieComplessiva(d, oggi = new Date()) {
  if (!d.habits.length) return { attuale: 0, migliore: 0 };
  const ok = keyOf(oggi);
  return serieDaStati(giorni(primoGiorno(d), oggi).map(g => statoGiorno(d, g, ok)));
}

// Serie complessiva contando solo i giorni da "daKey" in poi (per l'obiettivo di serie:
// i giorni fatti prima di impostarlo non contano).
export function serieDal(d, daKey, oggi = new Date()) {
  if (!d.habits.length) return 0;
  const start = [primoGiorno(d), daKey].sort()[1], ok = keyOf(oggi); // il più recente dei due
  if (start > ok) return 0;
  return serieDaStati(giorni(start, oggi).map(g => statoGiorno(d, g, ok))).attuale;
}

// Avanzamento dell'obiettivo di serie: { fatti, giorni, manca, raggiunto } oppure null se non c'è.
export function progressoObiettivo(d, oggi = new Date()) {
  const o = d.obiettivo;
  if (!o) return null;
  const fatti = Math.min(serieDal(d, o.creato, oggi), o.giorni);
  return { fatti, giorni: o.giorni, manca: o.giorni - fatti, raggiunto: fatti >= o.giorni };
}

// ---------- percentuali ----------

// % di giorni previsti completati tra from e to (inclusi); null se nessun giorno conta.
// Oggi conta solo se già fatto.
export function percentuale(d, h, from, to, oggi = new Date()) {
  const ok = keyOf(oggi);
  let tot = 0, si = 0;
  for (let g = new Date(from); keyOf(g) <= keyOf(to); g = addDays(g, 1)) {
    const s = statoAbitudine(d, h, g, ok);
    if (s !== '-') { tot++; if (s === 'si') si++; }
  }
  return tot ? Math.round(si / tot * 100) : null;
}

// come sopra, ma su tutte le abitudini insieme (ogni abitudine prevista in un giorno vale 1)
export function percentualeComplessiva(d, from, to, oggi = new Date()) {
  const ok = keyOf(oggi);
  let tot = 0, si = 0;
  for (let g = new Date(from); keyOf(g) <= keyOf(to); g = addDays(g, 1)) {
    for (const h of d.habits) {
      const s = statoAbitudine(d, h, g, ok);
      if (s !== '-') { tot++; if (s === 'si') si++; }
    }
  }
  return tot ? Math.round(si / tot * 100) : null;
}

// ---------- statistiche ----------

// L'abitudine più costante negli ultimi `n` giorni: la percentuale più alta
// (servono almeno 4 giorni previsti, altrimenti è troppo presto per dirlo).
// A parità vince la serie attuale più lunga. Restituisce { h, pct } oppure null.
export function piuCostante(d, oggi = new Date(), n = 30) {
  const from = addDays(oggi, -(n - 1)), ok = keyOf(oggi);
  let best = null;
  for (const h of d.habits) {
    let tot = 0;
    for (let g = new Date(from); keyOf(g) <= ok; g = addDays(g, 1)) if (statoAbitudine(d, h, g, ok) !== '-') tot++;
    if (tot < 4) continue;
    const pct = percentuale(d, h, from, oggi, oggi), serie = serieAbitudine(d, h, oggi).attuale;
    if (!best || pct > best.pct || (pct === best.pct && serie > best.serie)) best = { h, pct, serie };
  }
  return best && { h: best.h, pct: best.pct };
}

// Quota di abitudini fatte in un giorno (0..1), per colorare la griglia; null se niente previsto.
export function livelloGiorno(d, day) {
  const { previste, fatte } = riepilogoGiorno(d, day);
  return previste ? fatte / previste : null;
}

// Umore e abitudini: confronta l'umore medio dei giorni completi con quello degli altri giorni,
// e per ogni abitudine l'umore nei giorni in cui è stata fatta rispetto a quando è stata saltata.
// Considera gli ultimi `n` giorni prima di oggi (oggi escluso: non è finito).
// È una correlazione, non una prova di causa: lo spiega anche la schermata.
export function umoreEAbitudini(d, oggi = new Date(), n = 90) {
  const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const pieni = [], altri = [], perAbitudine = new Map(d.habits.map(h => [h.id, { si: [], no: [] }]));
  const ok = keyOf(oggi);
  for (let i = 1; i <= n; i++) {
    const g = addDays(oggi, -i), k = keyOf(g);
    const mood = d.journal && d.journal[k] && d.journal[k].mood;
    if (!mood) continue;
    const s = statoGiorno(d, g, ok);
    if (s === 'si') pieni.push(mood); else if (s === 'no') altri.push(mood);
    for (const h of d.habits) {
      const sh = statoAbitudine(d, h, g, ok);
      if (sh !== '-') perAbitudine.get(h.id)[sh].push(mood);
    }
  }
  // abitudini con almeno 3 giorni fatti e 3 saltati con l'umore segnato, ordinate per differenza
  const abitudini = d.habits
    .map(h => ({ h, ...perAbitudine.get(h.id) }))
    .filter(x => x.si.length >= 3 && x.no.length >= 3)
    .map(x => ({ h: x.h, diff: media(x.si) - media(x.no) }))
    .sort((a, b) => b.diff - a.diff);
  return {
    giorniConUmore: pieni.length + altri.length,
    pieni: { media: media(pieni), n: pieni.length },
    altri: { media: media(altri), n: altri.length },
    abitudini
  };
}

// "ogni giorno", "Lun Mer Ven", ...
export function daysLabel(h) {
  if (h.days.length === 7) return 'ogni giorno';
  if (!h.days.length) return 'nessun giorno';
  return DAY_ORDER.filter(x => h.days.includes(x)).map(x => DAYS[x]).join(' ');
}
