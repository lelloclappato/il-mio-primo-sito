// Conversione dei dati dai formati vecchi a quello attuale.
//
// Ogni volta che il formato cambia, "version" aumenta di 1 e qui si aggiunge un passo
// che porta i dati dalla versione precedente a quella nuova. I passi si applicano in fila:
// dati v1 → v2 → v3 ... Così anche un backup molto vecchio si può ancora importare.
//
// Formato attuale (versione 2):
// {
//   version: 2,
//   lastBackup: "AAAA-MM-GG" | null,
//   habits:  [{ id, name, type: 'check' | 'qty', target, unit, step, days: [0..6], created: "AAAA-MM-GG" }],
//   logs:    { "AAAA-MM-GG": { idAbitudine: valore } },      // solo i giorni con qualcosa di segnato
//   journal: { "AAAA-MM-GG": { mood: 1..5, note: "testo" } }, // nota e umore del giorno (facoltativi)
//   settings: { reminder: { on: false, time: "20:30" } }
// }
import { todayKey, uid } from './utili.js';

export const CURRENT_VERSION = 2;

export function defaultSettings() {
  return { reminder: { on: false, time: '20:30' } };
}

// Porta un oggetto dati (versione 1 o 2) al formato attuale. Non modifica l'originale.
export function upgrade(d) {
  d = JSON.parse(JSON.stringify(d)); // copia profonda
  const v = Number(d.version) || 1;
  // v1 → v2: nascono il diario (nota e umore) e le impostazioni
  if (v < 2) { d.journal = {}; d.settings = defaultSettings(); }
  // campi mancanti o rovinati: si rimettono i valori predefiniti
  if (!d.journal || typeof d.journal !== 'object' || Array.isArray(d.journal)) d.journal = {};
  if (!d.settings || typeof d.settings !== 'object') d.settings = defaultSettings();
  d.settings = { ...defaultSettings(), ...d.settings, reminder: { ...defaultSettings().reminder, ...(d.settings.reminder || {}) } };
  if (d.lastBackup === undefined) d.lastBackup = null;
  d.version = CURRENT_VERSION;
  return d;
}

// Converte le abitudini della prima versione dell'app ([{ id, name, log: { data: true } }],
// solo Sì/No, ogni giorno) e le aggiunge a `d`. Salta quelle con lo stesso nome di
// un'abitudine già presente. Restituisce i nomi aggiunti.
export function importOldTracker(old, d) {
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
