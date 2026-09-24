// Controllo di un file di backup prima di importarlo.
//
// Un file può arrivare da una versione vecchia dell'app, essere stato modificato a mano
// o essere proprio un altro file. Prima di sostituire i dati controlliamo tutto:
// - gli ERRORI bloccano l'importazione (es. un'abitudine senza nome);
// - gli AVVISI no: il problema viene corretto e l'utente viene informato
//   (es. valori segnati per un'abitudine che non esiste più → ignorati).
// È una funzione "pura": riceve l'oggetto letto dal file e restituisce il risultato.
import { upgrade, importOldTracker, CURRENT_VERSION } from './migrazione.js';

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const isData = s => typeof s === 'string' && DATA_RE.test(s) && !isNaN(new Date(s + 'T12:00:00'));
const isOggetto = o => !!o && typeof o === 'object' && !Array.isArray(o);
const numPos = n => typeof n === 'number' && isFinite(n) && n > 0;

// Restituisce { ok, errori, avvisi, dati, riepilogo }.
// Se ok è true, `dati` è già convertito al formato attuale e pronto da salvare.
export function controllaBackup(input) {
  const errori = [], avvisi = [];
  const fine = () => ({ ok: false, errori, avvisi, dati: null, riepilogo: null });

  // formato della prima versione dell'app: una lista di abitudini
  if (Array.isArray(input)) {
    const d = { version: 1, lastBackup: null, habits: [], logs: {} };
    importOldTracker(input, d);
    if (!d.habits.length) { errori.push('Il file non contiene abitudini riconoscibili.'); return fine(); }
    avvisi.push('Il file viene dalla prima versione dell’app: le abitudini diventano “Sì / No”, previste ogni giorno.');
    input = d;
  }

  if (!isOggetto(input) || !Array.isArray(input.habits) || !isOggetto(input.logs)) {
    errori.push('Il file non sembra un backup di Abitudini: mancano l’elenco delle abitudini o lo storico.');
    return fine();
  }
  const versione = input.version === undefined ? 1 : input.version;
  if (!Number.isInteger(versione) || versione < 1) { errori.push('Il numero di versione del backup non è valido.'); return fine(); }
  if (versione > CURRENT_VERSION) { errori.push('Il backup è stato creato da una versione più nuova dell’app: aggiorna l’app (ricarica la pagina) e riprova.'); return fine(); }
  if (input.habits.length > 500) { errori.push('Il file contiene troppe abitudini (più di 500).'); return fine(); }

  // ---------- abitudini ----------
  const ids = new Set(), habits = [];
  input.habits.forEach((h, i) => {
    const dove = `Abitudine n. ${i + 1}` + (h && typeof h.name === 'string' && h.name.trim() ? ` («${h.name.trim().slice(0, 40)}»)` : '');
    if (!isOggetto(h)) { errori.push(`${dove}: non è scritta nel formato giusto.`); return; }
    if (typeof h.id !== 'string' || !h.id) { errori.push(`${dove}: manca il codice identificativo (id).`); return; }
    if (ids.has(h.id)) { errori.push(`${dove}: il codice identificativo “${h.id}” è ripetuto.`); return; }
    if (typeof h.name !== 'string' || !h.name.trim()) { errori.push(`${dove}: manca il nome.`); return; }
    if (h.type !== 'check' && h.type !== 'qty') { errori.push(`${dove}: il tipo deve essere “check” (Sì / No) o “qty” (quantità).`); return; }
    if (h.type === 'qty' && !numPos(h.target)) { errori.push(`${dove}: l’obiettivo deve essere un numero maggiore di zero.`); return; }
    if (!Array.isArray(h.days) || !h.days.length || h.days.some(x => !Number.isInteger(x) || x < 0 || x > 6)) {
      errori.push(`${dove}: i giorni della settimana devono essere numeri da 0 (domenica) a 6 (sabato).`); return;
    }
    if (!isData(h.created)) { errori.push(`${dove}: la data di creazione non è valida (serve AAAA-MM-GG).`); return; }
    ids.add(h.id);
    const nome = h.name.trim();
    if (nome.length > 40) avvisi.push(`${dove}: il nome è stato accorciato a 40 caratteri.`);
    habits.push({
      id: h.id, name: nome.slice(0, 40), type: h.type,
      target: h.type === 'qty' ? h.target : 1,
      unit: h.type === 'qty' && typeof h.unit === 'string' ? h.unit.slice(0, 12) : '',
      step: h.type === 'qty' ? (numPos(h.step) ? h.step : 1) : 1,
      days: [...new Set(h.days)].sort(), created: h.created
    });
  });
  if (errori.length) return fine();

  // ---------- storico ----------
  const logs = {};
  let dateRotte = 0, valoriRotti = 0, sconosciute = 0;
  for (const [k, giorno] of Object.entries(input.logs)) {
    if (!isData(k) || !isOggetto(giorno)) { dateRotte++; continue; }
    for (const [hid, v] of Object.entries(giorno)) {
      if (!ids.has(hid)) { sconosciute++; continue; }
      if (typeof v !== 'number' || !isFinite(v) || v < 0) { valoriRotti++; continue; }
      if (v > 0) (logs[k] = logs[k] || {})[hid] = v;
    }
  }
  if (dateRotte) avvisi.push(`${dateRotte} ${dateRotte === 1 ? 'giorno con la data scritta male è stato ignorato' : 'giorni con la data scritta male sono stati ignorati'}.`);
  if (valoriRotti) avvisi.push(`${valoriRotti} ${valoriRotti === 1 ? 'valore non valido è stato ignorato' : 'valori non validi sono stati ignorati'}.`);
  if (sconosciute) avvisi.push(`${sconosciute} ${sconosciute === 1 ? 'valore di un’abitudine che non esiste è stato ignorato' : 'valori di abitudini che non esistono sono stati ignorati'}.`);

  // ---------- diario (nota e umore) ----------
  const journal = {};
  if (isOggetto(input.journal)) {
    for (const [k, g] of Object.entries(input.journal)) {
      if (!isData(k) || !isOggetto(g)) continue;
      const out = {};
      if (Number.isInteger(g.mood) && g.mood >= 1 && g.mood <= 5) out.mood = g.mood;
      if (typeof g.note === 'string' && g.note.trim()) out.note = g.note.slice(0, 500);
      if (Object.keys(out).length) journal[k] = out;
    }
  }

  const dati = upgrade({
    version: versione,
    lastBackup: isData(input.lastBackup) ? input.lastBackup : null,
    habits, logs, journal,
    settings: isOggetto(input.settings) ? input.settings : undefined
  });
  if (versione < 2) { dati.journal = journal; }

  const giorni = Object.keys(logs).sort();
  return {
    ok: true, errori, avvisi, dati,
    riepilogo: { abitudini: habits.length, giorni: giorni.length, dal: giorni[0] || null, al: giorni[giorni.length - 1] || null }
  };
}
