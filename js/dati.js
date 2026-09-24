// Tutto ciò che riguarda il salvataggio: leggere e scrivere i dati nel browser.
// Il formato dei dati è descritto in migrazione.js.
import { todayKey, uid } from './utili.js';
import { upgrade, importOldTracker, defaultSettings, CURRENT_VERSION } from './migrazione.js';
import { valore } from './calcoli.js';

// Nome sotto cui i dati sono salvati nel browser. Deve essere unico: tutte le app
// pubblicate su lelloclappato.github.io condividono lo stesso localStorage.
// ("v1" è la versione del nome, non del formato: il formato è nel campo "version" dei dati.)
export const STORE = 'abitudini-app-v1';

// Chiavi usate dalle versioni precedenti di QUESTA app. Dopo la migrazione non vengono
// cancellate: restano nel browser come copia di sicurezza dei dati vecchi.
// (Le chiavi di altre app, es. "finanze-personali-data", non vanno mai toccate.)
const OLD_STORE = 'abitudini.v1';        // versione 1.0 dell'app
const OLDER_STORE = 'habits-tracker-v1'; // prima versione: [{ id, name, log: { "AAAA-MM-GG": true } }]

function defaultData() {
  const t = todayKey();
  return {
    version: CURRENT_VERSION,
    lastBackup: null,
    habits: [
      { id: uid(), name: 'Acqua', type: 'qty', target: 2, unit: 'L', step: 0.25, days: [0, 1, 2, 3, 4, 5, 6], created: t },
      { id: uid(), name: 'Sonno', type: 'qty', target: 8, unit: 'ore', step: 0.5, days: [0, 1, 2, 3, 4, 5, 6], created: t },
      { id: uid(), name: 'Palestra', type: 'check', target: 1, unit: '', step: 1, days: [1, 3, 5], created: t }
    ],
    logs: {},
    journal: {},
    settings: defaultSettings()
  };
}

// ---------- lettura e migrazione ----------

// legge una chiave e la trasforma da testo JSON a oggetto; null se manca o è illeggibile
function readJSON(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
export function isValid(d) { return !!d && Array.isArray(d.habits) && !!d.logs && typeof d.logs === 'object'; }

// Mette da parte una copia del testo salvato sotto un nome a sé, senza sovrascrivere
// una copia già esistente (la prima copia è quella più preziosa).
function safetyCopy(name, raw) {
  const key = STORE + '-' + name;
  try { if (raw !== null && localStorage.getItem(key) === null) localStorage.setItem(key, raw); } catch (e) {}
}

// Messaggio da mostrare in "Oggi" dopo una migrazione (null = niente da dire).
export let migrationNote = null;
export function clearMigrationNote() { migrationNote = null; }

function load() {
  const raw = localStorage.getItem(STORE);
  const cur = readJSON(STORE);
  if (isValid(cur)) {
    if (cur.version === CURRENT_VERSION) return upgrade(cur); // upgrade qui ripara solo campi mancanti
    // formato vecchio: prima la copia di sicurezza, poi la conversione
    safetyCopy('backup-formato-v' + (cur.version || 1), raw);
    const d = upgrade(cur);
    try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {}
    return d;
  }
  // se sotto la chiave nuova c'è qualcosa di illeggibile, lo mettiamo da parte invece di sovrascriverlo
  if (raw !== null) safetyCopy('illeggibile', raw);
  return migrateOldKeys();
}

// Cerca i dati delle versioni precedenti dell'app (chiavi vecchie) e li porta sotto la chiave nuova.
function migrateOldKeys() {
  let d = null;
  const notes = [];

  // 1) versione 1.0 dell'app
  const v1 = readJSON(OLD_STORE);
  if (isValid(v1)) { d = upgrade(v1); notes.push('Ho spostato i tuoi dati nel nuovo spazio di salvataggio.'); }

  // 2) prima versione: va convertita
  const old = readJSON(OLDER_STORE);
  if (Array.isArray(old)) {
    if (!d) d = upgrade({ version: 1, lastBackup: null, habits: [], logs: {} });
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

// I dati in memoria. Gli altri file li leggono con `import { data }`;
// per sostituirli del tutto (es. importando un backup) si usa setData.
export let data = load();
export function setData(d) { data = d; save(); }

export function save() {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { alert('Impossibile salvare i dati: memoria del browser piena o bloccata.'); }
}

// ---------- valori segnati ----------
export function getVal(hid, k) { return valore(data, hid, k); }
export function setVal(hid, k, v) {
  v = Math.max(0, Math.round(v * 100) / 100);
  if (!data.logs[k]) data.logs[k] = {};
  // lo zero non si salva: così il file resta piccolo
  if (v === 0) { delete data.logs[k][hid]; if (!Object.keys(data.logs[k]).length) delete data.logs[k]; }
  else data.logs[k][hid] = v;
  save();
}

// ---------- diario: nota e umore del giorno ----------
export function getJournal(k) { return data.journal[k] || {}; }
// campo = 'mood' | 'note'; un valore vuoto cancella il campo, un giorno vuoto sparisce
export function setJournal(k, campo, v) {
  const g = { ...(data.journal[k] || {}) };
  if (v === null || v === '' || v === undefined) delete g[campo]; else g[campo] = v;
  if (Object.keys(g).length) data.journal[k] = g; else delete data.journal[k];
  save();
}
