// Motore del gioco della pianta.
//
// Ripercorre la storia giorno per giorno, dal primo giorno a oggi, e calcola:
// punti di crescita, stadio della pianta, salute, salvagenti usati e medaglie.
// Niente viene salvato: tutto si ricalcola dai dati delle abitudini. Così, se correggi
// un giorno passato, anche la pianta si aggiorna, e i punti non possono mai "sporcarsi".
// È una funzione pura (riceve i dati e la data di oggi): si può provare nei test.
import { keyOf, weekStart, fmt } from '../utili.js';
import { statiComplessivi, isDone, scheduled } from '../calcoli.js';
import { CONFIG } from './config.js';

// Elenco delle medaglie fisse. Quelle delle abitudini a quantità si aggiungono dopo (una per abitudine).
export const MEDAGLIE = [
  { id: 'primo-passo', nome: 'Primo passo', desc: 'Completa la tua prima abitudine.' },
  { id: 'giornata-perfetta', nome: 'Giornata perfetta', desc: 'Completa tutte le abitudini di un giorno.' },
  { id: 'serie-7', nome: 'Una settimana di fila', desc: 'Serie complessiva di 7 giorni.' },
  { id: 'settimana-perfetta', nome: 'Settimana perfetta', desc: 'Tutti i giorni di una settimana (da lunedì a domenica) perfetti.' },
  { id: 'serie-14', nome: 'Due settimane di fila', desc: 'Serie complessiva di 14 giorni.' },
  { id: 'cento', nome: 'Cento spunte', desc: 'Completa 100 abitudini in tutto.' },
  { id: 'diario-7', nome: 'Caro diario', desc: 'Segna l’umore in 7 giorni diversi.' },
  { id: 'serie-30', nome: 'Un mese di fila', desc: 'Serie complessiva di 30 giorni.' },
  { id: 'rinascita', nome: 'Rinascita', desc: 'Fai tornare in forma la pianta dopo che era appassita.' },
  { id: 'serie-66', nome: 'Abitudine automatica', desc: 'Serie complessiva di 66 giorni: il tempo medio perché un’abitudine diventi automatica.' },
  { id: 'stadio-1', nome: 'Germoglio', desc: 'La pianta spunta dal terreno.' },
  { id: 'stadio-2', nome: 'Piantina', desc: 'La pianta mette le prime foglie.' },
  { id: 'stadio-3', nome: 'Pianta', desc: 'La pianta è cresciuta e fiorisce.' },
  { id: 'stadio-4', nome: 'Albero', desc: 'La pianta è diventata un albero.' },
  { id: 'cinquecento', nome: 'Cinquecento spunte', desc: 'Completa 500 abitudini in tutto.' }
];

// moltiplicatore dei punti per una serie di n giorni
export function moltiplicatore(n) {
  return 1 + Math.min(CONFIG.moltiplicatore.tetto, CONFIG.moltiplicatore.perGiorno * n);
}

// indice dello stadio per un certo numero di punti
export function stadioDaPunti(punti) {
  let i = 0;
  CONFIG.stadi.forEach((s, j) => { if (punti >= s.punti) i = j; });
  return i;
}

export function simula(d, oggi = new Date()) {
  const C = CONFIG, S = C.salute, oggiK = keyOf(oggi);
  const stati = statiComplessivi(d, oggi);
  let punti = 0, salute = S.iniziale, serie = 0, puntiOggi = 0;
  let fatteTotali = 0, giorniUmore = 0, eraAppassita = false;
  const sblocca = {};                                   // id medaglia → giorno in cui è stata ottenuta
  const ottieni = (id, k) => { if (!sblocca[id]) sblocca[id] = k; };
  const quantita = {};                                  // id abitudine → totale segnato
  const qtyHabits = d.habits.filter(h => h.type === 'qty');
  let settimana = { inizio: null, ok: true, conta: 0 };  // per "settimana perfetta"
  const salvagenti = [];

  for (const { k, g, s, previste, fatte } of stati) {
    // ---- settimana perfetta: si controlla quando una settimana (lun-dom) è finita ----
    const lun = keyOf(weekStart(g));
    if (settimana.inizio !== lun) {
      settimana = { inizio: lun, ok: true, conta: 0, completa: stati[0].k <= lun };
    }

    if (previste > 0) {
      // ---- punti: abitudini fatte (anche oggi, subito) + bonus del giorno ----
      let base = 0;
      for (const h of d.habits) {
        if (scheduled(h, g) && isDone(d, h, k)) { base += C.punti[h.diff] || C.punti[2]; fatteTotali++; }
      }
      if (s === 'si') {
        serie++;
        base += C.bonusSerieSalva + (fatte === previste ? C.bonusGiornataPerfetta : 0);
      }
      const guadagno = Math.round(base * moltiplicatore(serie));
      punti += guadagno;
      if (k === oggiK) puntiOggi = guadagno;

      // ---- salute ----
      if (s === 'si') salute = Math.min(S.massima, salute + (fatte === previste ? S.giornataPerfetta : S.serieSalva));
      else if (s === 'no') {
        salute = Math.max(S.minima, salute - (fatte * 2 >= previste ? S.caloMorbido : S.calo));
        serie = 0;
      } else if (s === 'salv') salvagenti.push(k);

      // ---- settimana perfetta ----
      if (k !== oggiK || fatte === previste) { settimana.conta++; if (fatte !== previste) settimana.ok = false; }
      else settimana.ok = false; // oggi non ancora perfetto: la settimana in corso non è ancora completa
    }

    // ---- medaglie ----
    if (fatteTotali >= 1) ottieni('primo-passo', k);
    if (fatteTotali >= 100) ottieni('cento', k);
    if (fatteTotali >= 500) ottieni('cinquecento', k);
    if (previste > 0 && fatte === previste) ottieni('giornata-perfetta', k);
    for (const n of [7, 14, 30, 66]) if (serie >= n) ottieni('serie-' + n, k);
    const st = stadioDaPunti(punti);
    for (let i = 1; i <= st; i++) ottieni('stadio-' + i, k);
    if (salute < S.appassita) eraAppassita = true;
    if (eraAppassita && salute >= 80) ottieni('rinascita', k);
    if (d.journal && d.journal[k] && d.journal[k].mood) { giorniUmore++; if (giorniUmore >= 7) ottieni('diario-7', k); }
    for (const h of qtyHabits) {
      quantita[h.id] = (quantita[h.id] || 0) + ((d.logs[k] && d.logs[k][h.id]) || 0);
      if (quantita[h.id] >= h.target * C.medagliaQuantita - 1e-9) ottieni('quantita-' + h.id, k);
    }
    // domenica (fine settimana): se la settimana era intera e tutta perfetta
    if (g.getDay() === 0 && settimana.completa && settimana.ok && settimana.conta > 0) ottieni('settimana-perfetta', k);
  }

  const stadio = stadioDaPunti(punti);
  const prossimo = C.stadi[stadio + 1] || null;
  const da = C.stadi[stadio].punti;
  const meseOggi = oggiK.slice(0, 7);
  const usatiMese = salvagenti.filter(x => x.startsWith(meseOggi));

  // medaglie: quelle fisse + una per ogni abitudine a quantità
  const elenco = MEDAGLIE.concat(qtyHabits.map(h => ({
    id: 'quantita-' + h.id,
    nome: `${fmt(h.target * C.medagliaQuantita)} ${h.unit} di ${h.name}`.replace(/\s+/g, ' '),
    desc: `Arriva a ${fmt(h.target * C.medagliaQuantita)} ${h.unit} in tutto (${C.medagliaQuantita} volte l’obiettivo).`
  })));

  return {
    punti, puntiOggi, stadio, nomeStadio: C.stadi[stadio].nome, prossimo,
    progressoStadio: prossimo ? (punti - da) / (prossimo.punti - da) : 1,
    salute, aspetto: salute < S.appassita ? 'appassita' : salute < S.stanca ? 'stanca' : 'ok',
    serie, salvagenti,
    salvagente: { disponibili: Math.max(0, C.salvagentiAlMese - usatiMese.length), usatiMese },
    medaglie: elenco.map(m => ({ ...m, data: sblocca[m.id] || null }))
  };
}
