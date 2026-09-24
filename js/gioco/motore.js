// Motore del gioco della pianta.
//
// Ripercorre la storia giorno per giorno, dal primo giorno a oggi, e calcola:
// punti di crescita, stadio della pianta, salute, salvagenti usati e medaglie.
// Niente viene salvato: tutto si ricalcola dai dati delle abitudini. Così, se correggi
// un giorno passato, anche la pianta si aggiorna, e i punti non possono mai "sporcarsi".
// È una funzione pura (riceve i dati e la data di oggi): si può provare nei test.
import { keyOf, weekStart, fmt, addDays } from '../utili.js';
import { statiComplessivi, isDone, scheduled } from '../calcoli.js';
import { CONFIG } from './config.js';

// Elenco delle medaglie fisse. Quelle delle abitudini a quantità si aggiungono dopo (una per abitudine).
// Categorie: 'facile' (per iniziare), 'media' (impegnative), 'difficile' (leggendarie), 'strana' (strane e rare).
export const CATEGORIE = [['facile', 'Per iniziare'], ['media', 'Impegnative'], ['difficile', 'Leggendarie'], ['strana', 'Strane e rare']];
export const MEDAGLIE = [
  // --- per iniziare ---
  { id: 'primo-passo', cat: 'facile', nome: 'Primo passo', desc: 'Completa la tua prima abitudine.' },
  { id: 'giornata-perfetta', cat: 'facile', nome: 'Giornata perfetta', desc: 'Completa tutte le abitudini di un giorno.' },
  { id: 'serie-3', cat: 'facile', nome: 'Tre di fila', desc: 'Serie complessiva di 3 giorni.' },
  { id: 'primo-umore', cat: 'facile', nome: 'Come stai?', desc: 'Segna l’umore per la prima volta.' },
  { id: 'prima-nota', cat: 'facile', nome: 'Prima pagina', desc: 'Scrivi la tua prima nota del giorno.' },
  { id: 'tris', cat: 'facile', nome: 'Tris', desc: 'Tieni almeno 3 abitudini.' },
  { id: 'diario-7', cat: 'facile', nome: 'Caro diario', desc: 'Segna l’umore in 7 giorni diversi.' },
  { id: 'stadio-1', cat: 'facile', nome: 'Germoglio', desc: 'La pianta spunta dal terreno.' },
  { id: 'primo-obiettivo', cat: 'facile', nome: 'Obiettivo centrato', desc: 'Raggiungi il tuo primo obiettivo di serie.' },
  // --- impegnative ---
  { id: 'serie-7', cat: 'media', nome: 'Una settimana di fila', desc: 'Serie complessiva di 7 giorni.' },
  { id: 'settimana-perfetta', cat: 'media', nome: 'Settimana perfetta', desc: 'Tutti i giorni di una settimana (da lunedì a domenica) perfetti.' },
  { id: 'weekend', cat: 'media', nome: 'Weekend da campione', desc: 'Sabato e domenica di fila, entrambi perfetti.' },
  { id: 'lunedi', cat: 'media', nome: 'Lunedì? Nessun problema', desc: '4 lunedì perfetti (anche non di fila).' },
  { id: 'serie-14', cat: 'media', nome: 'Due settimane di fila', desc: 'Serie complessiva di 14 giorni.' },
  { id: 'cento', cat: 'media', nome: 'Cento spunte', desc: 'Completa 100 abitudini in tutto.' },
  { id: 'arcobaleno', cat: 'media', nome: 'Arcobaleno', desc: 'Usa tutti e 5 i livelli di umore, da “Pessima” a “Ottima”.' },
  { id: 'serena', cat: 'media', nome: 'Settimana serena', desc: '7 giorni di fila con umore “Bene” o “Ottima”.' },
  { id: 'poeta', cat: 'media', nome: 'Poeta', desc: 'Scrivi la nota del giorno in 10 giorni diversi.' },
  { id: 'doppio', cat: 'media', nome: 'Oltre ogni obiettivo', desc: 'In un’abitudine a quantità, fai almeno il doppio dell’obiettivo.' },
  { id: 'salvato', cat: 'media', nome: 'Salvato in extremis', desc: 'Il salvagente protegge la tua serie per la prima volta.' },
  { id: 'rinascita', cat: 'media', nome: 'Rinascita', desc: 'Fai tornare in forma la pianta dopo che era appassita.' },
  { id: 'rimonta', cat: 'media', nome: 'Rimonta', desc: 'Dopo aver perso una serie di almeno 7 giorni, arrivi di nuovo a 7.' },
  { id: 'stadio-2', cat: 'media', nome: 'Piantina', desc: 'La pianta mette le prime foglie.' },
  { id: 'stadio-3', cat: 'media', nome: 'Pianta', desc: 'La pianta è cresciuta.' },
  // --- leggendarie ---
  { id: 'serie-30', cat: 'difficile', nome: 'Un mese di fila', desc: 'Serie complessiva di 30 giorni.' },
  { id: 'serie-66', cat: 'difficile', nome: 'Abitudine automatica', desc: 'Serie complessiva di 66 giorni: il tempo medio perché un’abitudine diventi automatica.' },
  { id: 'serie-100', cat: 'difficile', nome: 'Cento giorni', desc: 'Serie complessiva di 100 giorni.' },
  { id: 'serie-365', cat: 'difficile', nome: 'Un anno di fila', desc: 'Serie complessiva di 365 giorni.' },
  { id: 'mese-perfetto', cat: 'difficile', nome: 'Mese perfetto', desc: 'Tutti i giorni di un mese, dal primo all’ultimo, perfetti.' },
  { id: 'pollice-verde', cat: 'difficile', nome: 'Pollice verde', desc: 'Pianta in forma per 60 giorni di fila.' },
  { id: 'cinquecento', cat: 'difficile', nome: 'Cinquecento spunte', desc: 'Completa 500 abitudini in tutto.' },
  { id: 'mille', cat: 'difficile', nome: 'Mille spunte', desc: 'Completa 1.000 abitudini in tutto.' },
  { id: 'romanziere', cat: 'difficile', nome: 'Romanziere', desc: 'Scrivi in tutto 5.000 caratteri nelle note del giorno.' },
  { id: 'tre-obiettivi', cat: 'difficile', nome: 'Tre traguardi', desc: 'Raggiungi 3 obiettivi di serie.' },
  { id: 'stadio-4', cat: 'difficile', nome: 'Albero', desc: 'La pianta raggiunge l’ultimo stadio.' },
  // --- strane e rare ---
  { id: 'pi-greco', cat: 'strana', nome: 'Pi greco', desc: 'Segna esattamente 3,14 in un’abitudine a quantità.' },
  { id: 'risposta', cat: 'strana', nome: 'La risposta', desc: 'Serie di 42 giorni: la risposta alla domanda fondamentale sulla vita, l’universo e tutto quanto (Douglas Adams).' },
  { id: 'venerdi-17', cat: 'strana', nome: 'Anti-scaramanzia', desc: 'Giornata perfetta di venerdì 17.' },
  { id: 'bisestile', cat: 'strana', nome: 'Giorno raro', desc: 'Completa un’abitudine il 29 febbraio (capita una volta ogni 4 anni).' },
  { id: 'capodanno', cat: 'strana', nome: 'Buon inizio', desc: 'Completa un’abitudine il 1° gennaio.' },
  { id: 'ferragosto', cat: 'strana', nome: 'Ferragosto attivo', desc: 'Giornata perfetta il 15 agosto.' },
  { id: 'palindromo', cat: 'strana', nome: 'Palindromo', desc: 'Completa un’abitudine in una data che si legge uguale al contrario (es. 03/02/2030 → 03022030).' },
  { id: 'metronomo', cat: 'strana', nome: 'Metronomo', desc: 'Segna lo stesso valore in un’abitudine a quantità per 10 giorni di fila.' },
  { id: 'anniversario', cat: 'strana', nome: 'Un anno insieme', desc: 'Usi l’app da un anno.' }
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
  // contatori per le altre medaglie
  const perfettoIl = {};                                // k → true se il giorno è stato perfetto
  const umoriVisti = new Set();
  let note = 0, caratteri = 0, umoreBuonoDiFila = 0, inFormaDiFila = 0, lunediPerfetti = 0;
  let persaSerie7 = false, serieMax = 0;
  const metronomo = {};                                 // id abitudine → { v, n } ultimo valore e quante volte di fila
  const creati = d.habits.map(h => h.created).sort();
  const nObiettivi = (d.traguardi || []).map(t => t.raggiunto).sort();

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
        serie++; if (serie > serieMax) serieMax = serie;
        base += C.bonusSerieSalva + (fatte === previste ? C.bonusGiornataPerfetta : 0);
      }
      const guadagno = Math.round(base * moltiplicatore(serie));
      punti += guadagno;
      if (k === oggiK) puntiOggi = guadagno;

      // ---- salute ----
      if (s === 'si') salute = Math.min(S.massima, salute + (fatte === previste ? S.giornataPerfetta : S.serieSalva));
      else if (s === 'no') {
        salute = Math.max(S.minima, salute - (fatte * 2 >= previste ? S.caloMorbido : S.calo));
        if (serie >= 7) persaSerie7 = true;
        serie = 0;
      } else if (s === 'salv') { salvagenti.push(k); ottieni('salvato', k); }
      if (fatte === previste) perfettoIl[k] = true;

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

    // ---- le altre medaglie ----
    const giorno = g.getDate(), mese = g.getMonth(), perf = !!perfettoIl[k], qualcosa = fatte > 0;
    for (const n of [3, 100, 365]) if (serie >= n) ottieni('serie-' + n, k);
    if (serie >= 42) ottieni('risposta', k);
    if (fatteTotali >= 1000) ottieni('mille', k);
    if (persaSerie7 && serie >= 7) ottieni('rimonta', k);
    if (creati.filter(c => c <= k).length >= 3) ottieni('tris', k);
    if (nObiettivi[0] && nObiettivi[0] <= k) ottieni('primo-obiettivo', k);
    if (nObiettivi[2] && nObiettivi[2] <= k) ottieni('tre-obiettivi', k);
    // weekend e lunedì
    if (g.getDay() === 0 && perf && perfettoIl[keyOf(addDays(g, -1))]) ottieni('weekend', k);
    if (g.getDay() === 1 && perf && ++lunediPerfetti >= 4) ottieni('lunedi', k);
    // mese perfetto: all'ultimo giorno del mese, se il mese è tutto nella storia e ogni giorno previsto era perfetto
    if (addDays(g, 1).getMonth() !== mese) {
      const primo = new Date(g.getFullYear(), mese, 1);
      if (keyOf(primo) >= stati[0].k) {
        const giorniMese = stati.filter(x => x.g.getMonth() === mese && x.g.getFullYear() === g.getFullYear() && x.previste > 0);
        if (giorniMese.length && giorniMese.every(x => perfettoIl[x.k])) ottieni('mese-perfetto', k);
      }
    }
    // pianta in forma a lungo
    inFormaDiFila = salute >= S.stanca ? inFormaDiFila + 1 : 0;
    if (inFormaDiFila >= 60) ottieni('pollice-verde', k);
    // umore e note
    const j = d.journal && d.journal[k];
    if (j && j.mood) { umoriVisti.add(j.mood); ottieni('primo-umore', k); if (umoriVisti.size === 5) ottieni('arcobaleno', k); }
    umoreBuonoDiFila = j && j.mood >= 4 ? umoreBuonoDiFila + 1 : 0;
    if (umoreBuonoDiFila >= 7) ottieni('serena', k);
    if (j && j.note) { note++; caratteri += j.note.length; ottieni('prima-nota', k); if (note >= 10) ottieni('poeta', k); if (caratteri >= 5000) ottieni('romanziere', k); }
    // abitudini a quantità: doppio dell'obiettivo, pi greco, stesso valore per 10 giorni
    for (const h of qtyHabits) {
      const v = (d.logs[k] && d.logs[k][h.id]) || 0;
      if (v >= h.target * 2 - 1e-9) ottieni('doppio', k);
      if (Math.abs(v - 3.14) < 1e-9) ottieni('pi-greco', k);
      const m = metronomo[h.id] || { v: null, n: 0 };
      metronomo[h.id] = v > 0 && Math.abs(v - m.v) < 1e-9 ? { v, n: m.n + 1 } : { v, n: v > 0 ? 1 : 0 };
      if (metronomo[h.id].n >= 10) ottieni('metronomo', k);
    }
    // date particolari
    if (qualcosa && mese === 1 && giorno === 29) ottieni('bisestile', k);
    if (qualcosa && mese === 0 && giorno === 1) ottieni('capodanno', k);
    if (perf && mese === 7 && giorno === 15) ottieni('ferragosto', k);
    if (perf && giorno === 17 && g.getDay() === 5) ottieni('venerdi-17', k);
    const ddmmyyyy = k.slice(8, 10) + k.slice(5, 7) + k.slice(0, 4);
    if (qualcosa && ddmmyyyy === [...ddmmyyyy].reverse().join('')) ottieni('palindromo', k);
    if (stati[0] && (g - stati[0].g) / 864e5 >= 365 - 0.5) ottieni('anniversario', k);
  }

  const stadio = stadioDaPunti(punti);
  const prossimo = C.stadi[stadio + 1] || null;
  const da = C.stadi[stadio].punti;
  const meseOggi = oggiK.slice(0, 7);
  const usatiMese = salvagenti.filter(x => x.startsWith(meseOggi));

  // medaglie: quelle fisse + una per ogni abitudine a quantità
  const elenco = MEDAGLIE.concat(qtyHabits.map(h => ({
    id: 'quantita-' + h.id, cat: 'media',
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
