// Piccole funzioni di uso generale: date, numeri, testo.
// Non sanno nulla delle abitudini: si possono riusare ovunque.

export const APP_VERSION = '1.2';

export const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']; // indice = Date.getDay()
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // mostrati da lunedì
export const DAYS_FULL = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
export const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

// ---------- date ----------
// Un giorno è identificato da una "chiave" testuale AAAA-MM-GG (es. "2026-09-24"),
// che si confronta in ordine alfabetico come in ordine di tempo.
export function pad(n) { return String(n).padStart(2, '0'); }
export function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export function todayKey() { return keyOf(new Date()); }
export function dateOf(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
// lunedì della settimana che contiene d, a mezzanotte
export function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

// ---------- varie ----------
export function uid() { return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
// numero all'italiana: 1.5 → "1,5"
export function fmt(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
// "esc" rende sicuro un testo scritto dall'utente prima di metterlo nell'HTML
// (altrimenti un nome come "<b>" verrebbe interpretato come codice)
export function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
