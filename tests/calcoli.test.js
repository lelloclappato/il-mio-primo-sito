// Test dei calcoli (serie, percentuali, statistiche, migrazione).
// "Oggi" è sempre giovedì 24 settembre 2026, così i risultati non cambiano col passare dei giorni.
import { test, uguale, esegui } from './mini-test.js';
import { keyOf, addDays } from '../js/utili.js';
import {
  serieDaStati, serieAbitudine, serieComplessiva, percentuale, percentualeComplessiva,
  piuCostante, livelloGiorno, umoreEAbitudini, isDone, necessarie
} from '../js/calcoli.js';
import { upgrade } from '../js/migrazione.js';
import { controllaBackup } from '../js/validazione.js';
import { simula, moltiplicatore, stadioDaPunti } from '../js/gioco/motore.js';
import { serieDal, progressoObiettivo, giorniSalvagente } from '../js/calcoli.js';
import { fraseMotivazionale, momento, elenco, citazioneDelGiorno, CITAZIONI } from '../js/frasi.js';

const OGGI = new Date(2026, 8, 24); // i mesi partono da 0: 8 = settembre. È un giovedì.
const k = n => keyOf(addDays(OGGI, -n)); // k(0) = oggi, k(1) = ieri, ...

// Crea dei dati di prova. fatti = { idAbitudine: [giorni fa in cui è fatta] }
function dati(habits, fatti = {}, journal = {}) {
  const logs = {};
  for (const [id, lista] of Object.entries(fatti)) {
    const h = habits.find(x => x.id === id);
    for (const n of lista) { (logs[k(n)] = logs[k(n)] || {})[id] = h.type === 'qty' ? h.target : 1; }
  }
  return { version: 4, habits, logs, journal, settings: {}, obiettivo: null, traguardi: [], gioco: null };
}
const ogniGiorno = (id, creata = 60) => ({ id, name: id, type: 'check', target: 1, unit: '', step: 1, days: [0, 1, 2, 3, 4, 5, 6], created: k(creata) });

// ---------- serieDaStati ----------
test('serie: sequenza semplice', () => uguale(serieDaStati(['si', 'si', 'no', 'si', 'si', 'si']), { attuale: 3, migliore: 3 }));
test('serie: i giorni non previsti non interrompono', () => uguale(serieDaStati(['si', '-', 'si', '-', '-', 'si']), { attuale: 3, migliore: 3 }));
test('serie: un giorno saltato azzera quella attuale ma non la migliore', () => uguale(serieDaStati(['si', 'si', 'si', 'si', 'no']), { attuale: 0, migliore: 4 }));
test('serie: lista vuota', () => uguale(serieDaStati([]), { attuale: 0, migliore: 0 }));

// ---------- serie di una abitudine ----------
test('abitudine: fatta gli ultimi 3 giorni, oggi non ancora → 3 (oggi non interrompe)', () => {
  const h = ogniGiorno('a');
  uguale(serieAbitudine(dati([h], { a: [1, 2, 3] }), h, OGGI).attuale, 3);
});
test('abitudine: fatta anche oggi → 4', () => {
  const h = ogniGiorno('a');
  uguale(serieAbitudine(dati([h], { a: [0, 1, 2, 3] }), h, OGGI).attuale, 4);
});
test('abitudine: saltata ieri → 0', () => {
  const h = ogniGiorno('a');
  uguale(serieAbitudine(dati([h], { a: [2, 3, 4] }), h, OGGI).attuale, 0);
});
test('abitudine Lun/Mer/Ven: i giorni non previsti vengono saltati', () => {
  // oggi è giovedì: ieri (1) mercoledì, 3 lunedì, 6 venerdì scorso, 8 mercoledì...
  const h = { ...ogniGiorno('p'), days: [1, 3, 5] };
  uguale(serieAbitudine(dati([h], { p: [1, 3, 6, 8] }), h, OGGI).attuale, 4);
});
test('abitudine: i giorni prima della creazione non contano', () => {
  const h = ogniGiorno('a', 2); // creata 2 giorni fa
  uguale(serieAbitudine(dati([h], { a: [0, 1, 2] }), h, OGGI), { attuale: 3, migliore: 3 });
});
test('abitudine: serie migliore nel passato', () => {
  const h = ogniGiorno('a', 20);
  uguale(serieAbitudine(dati([h], { a: [1, 2, 10, 11, 12, 13, 14] }), h, OGGI), { attuale: 2, migliore: 5 });
});
test('quantità: raggiungere solo metà obiettivo non completa', () => {
  const h = { id: 'w', name: 'Acqua', type: 'qty', target: 2, unit: 'L', step: 0.25, days: [0, 1, 2, 3, 4, 5, 6], created: k(10) };
  const d = dati([h], { w: [1] });
  d.logs[k(2)] = { w: 1 };
  uguale(isDone(d, h, k(1)), true);
  uguale(isDone(d, h, k(2)), false);
  uguale(serieAbitudine(d, h, OGGI).attuale, 1);
});
test('quantità: 0,1 + 0,2 conta come 0,3 (arrotondamenti)', () => {
  const h = { id: 'x', name: 'x', type: 'qty', target: 0.3, unit: '', step: 0.1, days: [0, 1, 2, 3, 4, 5, 6], created: k(3) };
  uguale(isDone({ logs: { [k(0)]: { x: 0.1 + 0.2 } } }, h, k(0)), true);
});

// ---------- serie complessiva ----------
test('complessiva: conta solo i giorni con tutte le abitudini previste fatte', () => {
  const a = ogniGiorno('a'), b = ogniGiorno('b');
  uguale(serieComplessiva(dati([a, b], { a: [1, 2, 3], b: [1, 2] }), OGGI).attuale, 2);
});
test('complessiva: un giorno senza abitudini previste non interrompe', () => {
  const a = { ...ogniGiorno('a'), days: [1, 3, 5] }; // oggi giovedì: niente previsto
  uguale(serieComplessiva(dati([a], { a: [1, 3] }), OGGI).attuale, 2);
});
test('soglia 80%: quante ne servono (arrotondando)', () => {
  uguale([1, 2, 3, 4, 5, 10].map(n => necessarie(n, 0.8)), [1, 2, 2, 3, 4, 8]);
  uguale([1, 2, 3].map(n => necessarie(n, 1)), [1, 2, 3]);
  uguale(necessarie(0, 0.8), 0);
});
test('complessiva con soglia 80%: 2 su 3 bastano', () => {
  const a = ogniGiorno('a'), b = ogniGiorno('b'), c = ogniGiorno('c');
  const d = dati([a, b, c], { a: [1, 2, 3], b: [1, 2, 3], c: [3] });
  uguale(serieComplessiva(d, OGGI).attuale, 0, 'con il 100% la serie è 0');
  d.settings.soglia = 0.8;
  uguale(serieComplessiva(d, OGGI).attuale, 3, 'con l’80% la serie è 3');
});
test('complessiva: nessuna abitudine → 0', () => uguale(serieComplessiva(dati([]), OGGI), { attuale: 0, migliore: 0 }));

// ---------- percentuali ----------
test('percentuale: oggi non ancora fatto non abbassa la percentuale', () => {
  const h = ogniGiorno('a');
  uguale(percentuale(dati([h], { a: [1, 2] }), h, addDays(OGGI, -3), OGGI, OGGI), 67); // 2 su 3 (oggi escluso)
});
test('percentuale: nessun giorno previsto → null', () => {
  const h = { ...ogniGiorno('a'), days: [0] }; // solo domenica
  uguale(percentuale(dati([h]), h, addDays(OGGI, -2), OGGI, OGGI), null);
});
test('percentuale complessiva su più abitudini', () => {
  const a = ogniGiorno('a'), b = ogniGiorno('b');
  // ieri e l'altro ieri: a fatta 2 volte, b 1 volta → 3 su 4
  uguale(percentualeComplessiva(dati([a, b], { a: [1, 2], b: [1] }), addDays(OGGI, -2), addDays(OGGI, -1), OGGI), 75);
});
test('livello del giorno per la griglia', () => {
  const a = ogniGiorno('a'), b = ogniGiorno('b');
  uguale(livelloGiorno(dati([a, b], { a: [1] }), addDays(OGGI, -1)), 0.5);
});

// ---------- statistiche ----------
test('più costante: vince la percentuale più alta', () => {
  const a = ogniGiorno('a'), b = ogniGiorno('b');
  const r = piuCostante(dati([a, b], { a: [1, 2, 3, 4, 5], b: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19] }), OGGI, 10);
  uguale([r.h.id, r.pct], ['a', 56]); // a: 5 su 9; b: 5 su 9 → a parità vince la serie attuale più lunga (a)
});
test('più costante: troppo pochi giorni → null', () => {
  const a = ogniGiorno('a', 2);
  uguale(piuCostante(dati([a], { a: [1, 2] }), OGGI), null);
});
test('umore: confronto tra giorni completi e non', () => {
  const a = ogniGiorno('a');
  const journal = {}; for (let i = 1; i <= 6; i++) journal[k(i)] = { mood: i <= 3 ? 5 : 2 };
  const r = umoreEAbitudini(dati([a], { a: [1, 2, 3] }, journal), OGGI);
  uguale([r.pieni.media, r.pieni.n, r.altri.media, r.altri.n, r.abitudini[0].diff], [5, 3, 2, 3, 3]);
});

// ---------- migrazione ----------
test('migrazione v1 → v4: aggiunge diario, impostazioni, obiettivo e gioco, tiene i dati', () => {
  const v1 = { version: 1, lastBackup: null, habits: [ogniGiorno('a')], logs: { [k(1)]: { a: 1 } } };
  const v2 = upgrade(v1);
  uguale([v2.version, v2.journal, v2.settings.reminder.on, v2.logs, v2.habits.length, v2.obiettivo, v2.traguardi, v2.habits[0].diff, v2.gioco.nome, v2.gioco.coriandoli], [4, {}, false, v1.logs, 1, null, [], 2, '', true]);
  uguale(v1.version, 1, 'l’originale non deve cambiare');
});
test('migrazione: dati v2 con impostazioni incomplete vengono completati', () => {
  const r = upgrade({ version: 2, habits: [], logs: {}, journal: {}, settings: { reminder: { on: true } } });
  uguale(r.settings.reminder, { on: true, time: '20:30' });
  uguale(r.settings.soglia, 1);
  uguale(upgrade({ version: 2, habits: [], logs: {}, settings: { soglia: 0.8 } }).settings.soglia, 0.8);
  uguale(upgrade({ version: 2, habits: [], logs: {}, settings: { soglia: 0.5 } }).settings.soglia, 1, 'valori diversi da 1 e 0.8 non sono ammessi');
});

// ---------- controllo dei backup ----------
const buono = () => ({ version: 4, lastBackup: k(3), habits: [ogniGiorno('a'), { ...ogniGiorno('b'), type: 'qty', target: 2, unit: 'L', step: 0.5 }],
  logs: { [k(1)]: { a: 1, b: 1.5 }, [k(2)]: { a: 1 } }, journal: { [k(1)]: { mood: 4, note: 'ok' } }, settings: { reminder: { on: true, time: '21:00' } } });
test('backup valido: accettato con riepilogo', () => {
  const c = controllaBackup(buono());
  uguale([c.ok, c.errori, c.avvisi, c.riepilogo], [true, [], [], { abitudini: 2, giorni: 2, dal: k(2), al: k(1) }]);
  uguale([c.dati.journal[k(1)], c.dati.settings.reminder], [{ mood: 4, note: 'ok' }, { on: true, time: '21:00' }]);
});
test('backup: file che non è un backup', () => {
  uguale(controllaBackup({ ciao: 1 }).ok, false);
  uguale(controllaBackup('testo').ok, false);
  uguale(controllaBackup(null).ok, false);
});
test('backup: abitudine senza nome → errore con la posizione', () => {
  const d = buono(); d.habits[1].name = '  ';
  uguale(controllaBackup(d).errori, ['Abitudine n. 2: manca il nome.']);
});
test('backup: obiettivo non valido, giorni sbagliati, id ripetuto', () => {
  const d = buono(); d.habits[1].target = -1;
  uguale(controllaBackup(d).errori[0].includes('obiettivo'), true);
  const e = buono(); e.habits[0].days = [1, 9];
  uguale(controllaBackup(e).errori[0].includes('giorni della settimana'), true);
  const f = buono(); f.habits[1].id = 'a';
  uguale(controllaBackup(f).errori[0].includes('ripetuto'), true);
});
test('backup: versione più nuova dell’app → errore', () => {
  const d = buono(); d.version = 99;
  uguale(controllaBackup(d).ok, false);
});
test('backup: valori strani vengono ignorati con un avviso', () => {
  const d = buono();
  d.logs['2026-13-45'] = { a: 1 }; d.logs[k(4)] = { a: 'tanto', zz: 1 }; d.journal[k(2)] = { mood: 9 };
  const c = controllaBackup(d);
  uguale([c.ok, c.avvisi.length, c.dati.logs[k(4)], c.dati.journal[k(2)]], [true, 3, undefined, undefined]);
});
test('backup: versione 1 (senza diario) viene convertita', () => {
  const d = buono(); d.version = 1; delete d.journal; delete d.settings;
  const c = controllaBackup(d);
  uguale([c.ok, c.dati.version, c.dati.journal, c.dati.settings.reminder.on], [true, 4, {}, false]);
});
test('backup: formato della prima versione (lista)', () => {
  const c = controllaBackup([{ id: 'x', name: 'Yoga', log: { [k(1)]: true } }]);
  uguale([c.ok, c.dati.habits[0].name, c.riepilogo.giorni, c.avvisi.length], [true, 'Yoga', 1, 1]);
});
test('impostazioni: un orario non valido torna al predefinito', () => {
  uguale(upgrade({ version: 2, habits: [], logs: {}, settings: { reminder: { on: 'sì', time: '25:99' } } }).settings.reminder, { on: false, time: '20:30' });
});

// ---------- obiettivo di serie ----------
test('obiettivo: contano solo i giorni da quando è stato impostato', () => {
  const a = ogniGiorno('a');
  const d = dati([a], { a: [1, 2, 3, 4, 5, 6] });
  uguale(serieDal(d, k(2), OGGI), 2);                 // impostato 2 giorni fa: 2 giorni completi
  d.obiettivo = { giorni: 7, premio: 'cinema', creato: k(2) };
  uguale(progressoObiettivo(d, OGGI), { fatti: 2, giorni: 7, manca: 5, raggiunto: false });
});
test('obiettivo: raggiunto', () => {
  const a = ogniGiorno('a');
  const d = dati([a], { a: [0, 1, 2] });
  d.obiettivo = { giorni: 3, premio: '', creato: k(2) };
  uguale(progressoObiettivo(d, OGGI).raggiunto, true);
});
test('obiettivo: se la serie si interrompe il conteggio riparte', () => {
  const a = ogniGiorno('a');
  // 2 giorni saltati nello stesso mese: il primo lo copre il salvagente, il secondo interrompe la serie
  const d = dati([a], { a: [1, 3, 5, 6] });
  d.obiettivo = { giorni: 7, premio: '', creato: k(6) };
  uguale(progressoObiettivo(d, OGGI).fatti, 1);
});

// ---------- salvagente ----------
test('salvagente: il primo giorno mancato del mese non interrompe la serie', () => {
  const a = ogniGiorno('a', 10);
  const d = dati([a], { a: [1, 3, 4, 5] });           // k(2) saltato (22 settembre)
  uguale(serieComplessiva(d, OGGI).attuale, 4);       // 5, 4, 3 + (salvagente) + 1
  uguale(giorniSalvagente(d, OGGI), [k(2)]);
});
test('salvagente: uno solo al mese', () => {
  const a = ogniGiorno('a', 10);
  const d = dati([a], { a: [1, 3, 5, 6] });           // saltati k(2) e k(4), entrambi a settembre
  uguale(serieComplessiva(d, OGGI).attuale, 1);
  uguale(giorniSalvagente(d, OGGI), [k(4)]);
});
test('salvagente: non scatta se non c’è una serie da proteggere', () => {
  const a = ogniGiorno('a', 5);
  uguale(giorniSalvagente(dati([a], { a: [1] }), OGGI), []);
});
test('salvagente: un mese nuovo ne porta uno nuovo', () => {
  const a = ogniGiorno('a', 40);
  // oggi 24 settembre: saltati 25 agosto (k 30) e 20 settembre (k 4); il resto fatto
  const fatti = []; for (let i = 1; i <= 40; i++) if (i !== 30 && i !== 4) fatti.push(i);
  const d = dati([a], { a: fatti });
  uguale(giorniSalvagente(d, OGGI), [k(30), k(4)]);
  uguale(serieComplessiva(d, OGGI).attuale, 38);
});
test('obiettivo: nessun obiettivo → null', () => uguale(progressoObiettivo(dati([ogniGiorno('a')]), OGGI), null));
test('dati: obiettivo e traguardi non validi vengono scartati', () => {
  const r = upgrade({ version: 3, habits: [], logs: {}, obiettivo: { giorni: 1000, creato: k(1) },
    traguardi: [{ giorni: 7, raggiunto: k(3), premio: 'x' }, { giorni: 'tanti' }, null] });
  uguale([r.obiettivo, r.traguardi], [null, [{ giorni: 7, raggiunto: k(3), premio: 'x', pillola: null, visto: true }]]);
  uguale(upgrade({ version: 3, habits: [], logs: {}, obiettivo: { giorni: 21, premio: '  cena  ', creato: k(1) } }).obiettivo, { giorni: 21, premio: 'cena', creato: k(1) });
});
test('backup: l’obiettivo viene importato', () => {
  const d = buono(); d.obiettivo = { giorni: 14, premio: 'libro', creato: k(2) };
  uguale(controllaBackup(d).dati.obiettivo, { giorni: 14, premio: 'libro', creato: k(2) });
});

// ---------- frasi ----------
const F = (fatte, servono, mancanti, ora, serie = 3) => fraseMotivazionale({ previste: 4, fatte, servono, mancanti, serie, ora, chiaveGiorno: '2026-09-24' });
test('frasi: momento della giornata', () => uguale([6, 13, 20, 23, 3].map(momento), ['mattina', 'pomeriggio', 'sera', 'notte', 'notte']));
test('frasi: elenco dei nomi', () => {
  uguale([elenco(['A']), elenco(['A', 'B']), elenco(['A', 'B', 'C']), elenco(['A', 'B', 'C', 'D'])], ['A', 'A e B', 'A, B e C', 'A, B e altre 2']);
});
test('frasi: di sera, ne manca una per la serie → la nomina', () => {
  uguale(F(3, 4, ['Diario'], 20), 'Stasera ti manca solo Diario per continuare la serie. Pochi minuti e ci sei!');
});
test('frasi: appena iniziato → spinge a continuare con la prossima', () => {
  uguale(F(1, 4, ['Lettura', 'Yoga', 'Diario'], 10), 'Ottimo inizio! Adesso Lettura, finché sei in ritmo.');
});
test('frasi: niente fatto di pomeriggio', () => uguale(F(0, 4, ['Lettura'], 15), 'Il pomeriggio è ancora lungo: comincia da Lettura.'));
test('frasi: serie salva all’80%', () => uguale(F(3, 3, ['Yoga'], 10), 'Serie al sicuro. Se ti va, chiudi anche Yoga per la giornata perfetta.'));
test('frasi: senza serie dice "iniziare"', () => uguale(F(3, 4, ['Diario'], 10, 0), 'Ti manca solo Diario per iniziare la serie!'));
test('citazione del giorno: cambia ogni giorno e ha sempre un autore', () => {
  uguale(citazioneDelGiorno('2026-09-24') !== citazioneDelGiorno('2026-09-25'), true);
  uguale(CITAZIONI.every(c => c.testo && c.autore), true);
});

// ---------- gioco della pianta ----------
const giorniFatti = (da, a) => { const l = []; for (let i = da; i <= a; i++) l.push(i); return l; };
const medaglia = (r, id) => r.medaglie.find(m => m.id === id).data;
test('pianta: moltiplicatore della serie con tetto', () => uguale([moltiplicatore(0), moltiplicatore(10), moltiplicatore(15), moltiplicatore(100)], [1, 1.2, 1.3, 1.3]));
test('pianta: stadi', () => uguale([0, 299, 300, 1100, 2799, 5400, 9999].map(stadioDaPunti), [0, 0, 1, 2, 2, 4, 4]));
test('pianta: 4 abitudini medie, giorni perfetti → albero al 66° giorno', () => {
  const hs = ['a', 'b', 'c', 'd'].map(id => ogniGiorno(id, 90));
  const fino = n => dati(hs, Object.fromEntries(hs.map(h => [h.id, giorniFatti(1, n)])));
  const crea = n => { const d = fino(n); d.habits.forEach(h => h.created = k(n)); return d; };
  uguale(simula(crea(65), OGGI).stadio, 3, 'dopo 65 giorni è ancora "Pianta"');
  uguale(simula(crea(66), OGGI).nomeStadio, 'Albero');
  uguale([simula(crea(5), OGGI).stadio, simula(crea(4), OGGI).stadio], [1, 0], 'germoglio al 5° giorno');
  uguale([simula(crea(15), OGGI).stadio, simula(crea(35), OGGI).stadio], [2, 3], 'piantina al 15°, pianta al 35°');
});
test('pianta: la difficoltà cambia i punti', () => {
  const h = { ...ogniGiorno('a', 1), diff: 3 };
  uguale(simula(dati([h], { a: [1] }), OGGI).punti, Math.round((15 + 10 + 15) * 1.02));
});
test('pianta: i punti di oggi contano subito', () => {
  const h = { ...ogniGiorno('a', 0), diff: 2 };
  const r = simula(dati([h], { a: [0] }), OGGI);
  uguale([r.puntiOggi, r.punti], [Math.round(35 * 1.02), 36]);
});
test('pianta: i giorni saltati tolgono salute, non punti né stadio', () => {
  const hs = [ogniGiorno('a', 30), ogniGiorno('b', 30)];
  const d = dati(hs, { a: giorniFatti(6, 30), b: giorniFatti(6, 30) }); // 25 giorni perfetti, poi 5 saltati
  const prima = simula(d, addDays(OGGI, -5));   // il primo giorno saltato, quando non è ancora finito
  const dopo = simula(d, OGGI);
  uguale(dopo.punti, prima.punti, 'i punti restano');
  uguale(dopo.stadio, prima.stadio, 'lo stadio resta');
  // 5 giorni saltati: il primo lo copre il salvagente, gli altri 4 tolgono 10 ciascuno
  uguale([prima.salute, dopo.salute, dopo.aspetto], [100, 60, 'ok']);
});
test('pianta: la salute non scende mai sotto il minimo', () => {
  const r = simula(dati([ogniGiorno('a', 40)]), OGGI);
  uguale([r.salute, r.aspetto], [10, 'appassita']);
});
test('pianta: salute con metà fatto cala di meno', () => {
  const a = ogniGiorno('a', 1), b = ogniGiorno('b', 1);
  uguale(simula(dati([a, b], { a: [1] }), OGGI).salute, 75);   // 80 − 5
  uguale(simula(dati([a, b]), OGGI).salute, 70);               // 80 − 10
});
test('pianta: aspetto "stanca" dopo qualche giorno saltato', () => uguale(simula(dati([ogniGiorno('a', 3)]), OGGI).aspetto, 'stanca')); // 80 − 30 = 50
test('pianta: rinascita dopo essersi ripresa', () => {
  const r = simula(dati([ogniGiorno('a', 20)], { a: giorniFatti(1, 7) }), OGGI);
  uguale([r.salute, r.aspetto, !!medaglia(r, 'rinascita')], [100, 'ok', true]);
});
test('medaglie: settimana perfetta (da lunedì 14 a domenica 20 settembre)', () => {
  const r = simula(dati([ogniGiorno('a', 12)], { a: giorniFatti(4, 10) }), OGGI);
  uguale(medaglia(r, 'settimana-perfetta'), k(4));
});
test('medaglie: 30 L di acqua', () => {
  const w = { id: 'w', name: 'Acqua', type: 'qty', target: 2, unit: 'L', step: 0.25, days: [0, 1, 2, 3, 4, 5, 6], created: k(20), diff: 2 };
  const r = simula(dati([w], { w: giorniFatti(1, 15) }), OGGI);
  const m = r.medaglie.find(x => x.id === 'quantita-w');
  uguale([m.nome, m.data], ['30 L di Acqua', k(1)]);
});
test('medaglie: primo passo e giornata perfetta', () => {
  const r = simula(dati([ogniGiorno('a', 5), ogniGiorno('b', 5)], { a: [3, 2], b: [2] }), OGGI);
  uguale([medaglia(r, 'primo-passo'), medaglia(r, 'giornata-perfetta'), medaglia(r, 'serie-7')], [k(3), k(2), null]);
});
test('salvagente: disponibili nel mese', () => {
  const r = simula(dati([ogniGiorno('a', 10)], { a: [1, 3, 4, 5] }), OGGI);
  uguale(r.salvagente, { disponibili: 0, usatiMese: [k(2)] });
});

esegui();
