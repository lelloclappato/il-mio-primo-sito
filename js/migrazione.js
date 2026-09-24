// Conversione dei dati dai formati vecchi a quello attuale.
//
// Ogni volta che il formato cambia, "version" aumenta di 1 e qui si aggiunge un passo
// che porta i dati dalla versione precedente a quella nuova. I passi si applicano in fila:
// dati v1 → v2 → v3 ... Così anche un backup molto vecchio si può ancora importare.
//
// Formato attuale (versione 4):
// {
//   version: 4,
//   lastBackup: "AAAA-MM-GG" | null,
//   habits:  [{ id, name, type: 'check' | 'qty', target, unit, step, days: [0..6], created: "AAAA-MM-GG",
//               diff: 1 | 2 | 3 }],                            // difficoltà: facile, media, difficile
//   logs:    { "AAAA-MM-GG": { idAbitudine: valore } },      // solo i giorni con qualcosa di segnato
//   journal: { "AAAA-MM-GG": { mood: 1..5, note: "testo" } }, // nota e umore del giorno (facoltativi)
//   settings: { reminder: { on: false, time: "20:30" }, soglia: 1,  // soglia: 1 = tutte, 0.8 = circa l'80%
//               google: { riepilogo: false, calendarId: "", usato: false } },  // Google Calendar (nessun token qui!)
//   obiettivo: null | { giorni: 21, premio: "una cena fuori", creato: "AAAA-MM-GG" },  // obiettivo di serie in corso
//   traguardi: [{ giorni, premio, raggiunto: "AAAA-MM-GG", pillola: numero | null, visto: true | false }],
//   gioco: { nome: "", nomeChiesto: false, coriandoli: true, medaglieViste: [id], stadioVisto: 0, iniziato: false }
// }
import { todayKey, uid } from './utili.js';

export const CURRENT_VERSION = 4;

const isData = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function defaultSettings() {
  return { reminder: { on: false, time: '20:30' }, soglia: 1, google: { riepilogo: false, calendarId: '', usato: false } };
}

// Porta un oggetto dati (versione 1 o 2) al formato attuale. Non modifica l'originale.
export function upgrade(d) {
  d = JSON.parse(JSON.stringify(d)); // copia profonda
  const v = Number(d.version) || 1;
  // v1 → v2: nascono il diario (nota e umore) e le impostazioni
  if (v < 2) { d.journal = {}; d.settings = defaultSettings(); }
  // v2 → v3: nascono l'obiettivo di serie e l'elenco dei traguardi raggiunti
  if (v < 3) { d.obiettivo = null; d.traguardi = []; }
  // v3 → v4: difficoltà delle abitudini e stato del gioco della pianta
  if (v < 4) { d.gioco = null; }
  if (Array.isArray(d.habits)) for (const h of d.habits) if (h && ![1, 2, 3].includes(h.diff)) h.diff = 2;
  d.gioco = pulisciGioco(d.gioco);
  // campi mancanti o rovinati: si rimettono i valori predefiniti
  if (!d.journal || typeof d.journal !== 'object' || Array.isArray(d.journal)) d.journal = {};
  // impostazioni: si tengono solo valori sensati, il resto torna al predefinito
  const s = d.settings && typeof d.settings === 'object' && !Array.isArray(d.settings) ? d.settings : {};
  const r = s.reminder && typeof s.reminder === 'object' ? s.reminder : {};
  d.settings = { ...s, reminder: {
    on: r.on === true,
    time: typeof r.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time) ? r.time : defaultSettings().reminder.time
  }, soglia: s.soglia === 0.8 ? 0.8 : 1, google: pulisciGoogle(s.google) };
  d.obiettivo = pulisciObiettivo(d.obiettivo);
  d.traguardi = Array.isArray(d.traguardi) ? d.traguardi.map(pulisciTraguardo).filter(Boolean) : [];
  if (d.lastBackup === undefined) d.lastBackup = null;
  d.version = CURRENT_VERSION;
  return d;
}

// Impostazioni di Google Calendar. Il token di accesso NON è mai qui: resta solo in memoria.
function pulisciGoogle(g) {
  g = g && typeof g === 'object' ? g : {};
  return {
    riepilogo: g.riepilogo === true,
    calendarId: typeof g.calendarId === 'string' ? g.calendarId.slice(0, 300) : '',
    usato: g.usato === true
  };
}

// Obiettivo di serie: da 2 a 365 giorni, premio facoltativo (massimo 60 caratteri). Altrimenti null.
function pulisciObiettivo(o) {
  if (!o || typeof o !== 'object') return null;
  if (!Number.isInteger(o.giorni) || o.giorni < 2 || o.giorni > 365 || !isData(o.creato)) return null;
  return { giorni: o.giorni, premio: typeof o.premio === 'string' ? o.premio.trim().slice(0, 60) : '', creato: o.creato };
}
// Stato del gioco: nome della pianta (massimo 20 caratteri, vuoto = "Pianta"), coriandoli sì/no,
// medaglie e stadio già festeggiati (per non festeggiarli due volte).
export function pulisciGioco(g) {
  g = g && typeof g === 'object' && !Array.isArray(g) ? g : {};
  return {
    nome: typeof g.nome === 'string' ? g.nome.trim().slice(0, 20) : '',
    nomeChiesto: g.nomeChiesto === true,
    coriandoli: g.coriandoli !== false,
    medaglieViste: Array.isArray(g.medaglieViste) ? g.medaglieViste.filter(x => typeof x === 'string').slice(0, 500) : [],
    stadioVisto: Number.isInteger(g.stadioVisto) && g.stadioVisto >= 0 ? g.stadioVisto : 0,
    iniziato: g.iniziato === true
  };
}

function pulisciTraguardo(t) {
  if (!t || typeof t !== 'object' || !Number.isInteger(t.giorni) || t.giorni < 1 || !isData(t.raggiunto)) return null;
  return {
    giorni: t.giorni, raggiunto: t.raggiunto,
    premio: typeof t.premio === 'string' ? t.premio.slice(0, 60) : '',
    pillola: Number.isInteger(t.pillola) && t.pillola >= 0 ? t.pillola : null,
    visto: t.visto !== false
  };
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
