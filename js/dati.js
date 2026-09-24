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

const STORE = 'abitudini.v1';

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

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.habits)) return d; }
  } catch (e) {}
  return defaultData();
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
