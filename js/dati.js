// Tutto ciò che riguarda il salvataggio: leggere e scrivere i dati nel browser.
//
// Formato dei dati (un solo oggetto, salvato come testo JSON in localStorage):
// {
//   version: 1,
//   lastBackup: "AAAA-MM-GG" | null,
//   habits: [{ id, name, type: 'check' | 'qty', target, unit, step, days: [0..6], created: "AAAA-MM-GG" }],
//   logs: { "AAAA-MM-GG": { idAbitudine: valore } }   // solo i giorni con qualcosa di segnato
// }
import { todayKey, uid } from './utili.js';

// Nome sotto cui i dati sono salvati nel browser. Deve essere unico: tutte le app
// pubblicate su lelloclappato.github.io condividono lo stesso localStorage.
const STORE = 'abitudini-app-v1';

// Chiavi usate dalle versioni precedenti di QUESTA app. Dopo la migrazione non vengono
// cancellate: restano nel browser come copia di sicurezza dei dati vecchi.
// (Le chiavi di altre app, es. "finanze-personali-data", non vanno mai toccate.)
const OLD_STORE = 'abitudini.v1';        // versione 1.0: stesso formato di adesso
const OLDER_STORE = 'habits-tracker-v1'; // prima versione: [{ id, name, log: { "AAAA-MM-GG": true } }]

function defaultData() {
  const t = todayKey();
  return {
    version: 1,
    lastBackup: null,
    habits: [
      { id: uid(), name: 'Acqua', type: 'qty', target: 2, unit: 'L', step: 0.25, days: [0, 1, 2, 3, 4, 5, 6], created: t },
      { id: uid(), name: 'Sonno', type: 'qty', target: 8, unit: 'ore', step: 0.5, days: [0, 1, 2, 3, 4, 5, 6], created: t },
      { id: uid(), name: 'Palestra', type: 'check', target: 1, unit: '', step: 1, days: [1, 3, 5], created: t }
    ],
    logs: {}
  };
}

// ---------- lettura e migrazione ----------

// legge una chiave e la trasforma da testo JSON a oggetto; null se manca o è illeggibile
function readJSON(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function isValid(d) { return !!d && Array.isArray(d.habits) && !!d.logs && typeof d.logs === 'object'; }

// Messaggio da mostrare in "Oggi" dopo una migrazione (null = niente da dire).
export let migrationNote = null;
export function clearMigrationNote() { migrationNote = null; }

function load() {
  const cur = readJSON(STORE);
  if (isValid(cur)) return cur;
  // se sotto la chiave nuova c'è qualcosa di illeggibile, lo mettiamo da parte invece di sovrascriverlo
  const raw = localStorage.getItem(STORE);
  if (raw !== null) { try { localStorage.setItem(STORE + '-illeggibile', raw); } catch (e) {} }
  return migrate();
}

// Cerca i dati delle versioni precedenti e li porta sotto la chiave nuova.
function migrate() {
  let d = null;
  const notes = [];

  // 1) versione 1.0: il formato è lo stesso, basta copiarlo
  const v1 = readJSON(OLD_STORE);
  if (isValid(v1)) { d = v1; notes.push('Ho spostato i tuoi dati nel nuovo spazio di salvataggio.'); }

  // 2) prima versione: va convertita al formato attuale
  const old = readJSON(OLDER_STORE);
  if (Array.isArray(old)) {
    if (!d) d = { version: 1, lastBackup: null, habits: [], logs: {} };
    const added = importOldTracker(old, d);
    if (added.length) notes.push(`Ho recuperato dalla prima versione dell’app: ${added.join(', ')}.`);
  }

  // nessun dato vecchio: si parte con le abitudini di esempio
  if (!d) return defaultData();

  // si salva subito sotto la chiave nuova, così la migrazione avviene una volta sola
  try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {}
  if (notes.length) migrationNote = notes.join(' ') + ' I dati vecchi restano nel browser come copia di sicurezza.';
  return d;
}

// Converte le abitudini della prima versione (solo Sì/No, ogni giorno) e le aggiunge a `d`.
// Salta quelle con lo stesso nome di un'abitudine già presente. Restituisce i nomi aggiunti.
function importOldTracker(old, d) {
  const added = [];
  const names = new Set(d.habits.map(h => h.name.trim().toLowerCase()));
  for (const o of old) {
    if (!o || typeof o.name !== 'string' || !o.name.trim()) continue;
    const name = o.name.trim().slice(0, 40);
    if (names.has(name.toLowerCase())) continue;
    // solo date ben formate e segnate come fatte
    const dates = Object.keys(o.log && typeof o.log === 'object' ? o.log : {})
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && o.log[k]).sort();
    const id = uid();
    d.habits.push({ id, name, type: 'check', target: 1, unit: '', step: 1, days: [0, 1, 2, 3, 4, 5, 6], created: dates[0] || todayKey() });
    for (const k of dates) { if (!d.logs[k]) d.logs[k] = {}; d.logs[k][id] = 1; }
    names.add(name.toLowerCase());
    added.push(name);
  }
  return added;
}

// I dati in memoria. Gli altri file li leggono con `import { data }`;
// per sostituirli del tutto (es. importando un backup) si usa setData.
export let data = load();
export function setData(d) { data = d; save(); }

export function save() {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { alert('Impossibile salvare i dati: memoria del browser piena o bloccata.'); }
}

// ---------- valori segnati ----------
export function getVal(hid, k) { return (data.logs[k] && data.logs[k][hid]) || 0; }
export function setVal(hid, k, v) {
  v = Math.max(0, Math.round(v * 100) / 100);
  if (!data.logs[k]) data.logs[k] = {};
  // lo zero non si salva: così il file resta piccolo
  if (v === 0) { delete data.logs[k][hid]; if (!Object.keys(data.logs[k]).length) delete data.logs[k]; }
  else data.logs[k][hid] = v;
  save();
}
