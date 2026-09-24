// Funzioni "pure" per gli eventi del calendario (Fase 4, passo A): creano solo testo,
// senza leggere dati né toccare la pagina. Per questo si possono provare nei test.
// Le usa calendario.js (il pannello "Aggiungi al calendario").
import { addDays, pad, fmt } from './utili.js';

const GIORNI_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']; // indice = Date.getDay()

// Regola di ripetizione (RRULE, standard RFC 5545): ogni giorno, oppure solo certi giorni della settimana.
export function regolaRipetizione(days) {
  if (days.length === 7) return 'RRULE:FREQ=DAILY';
  return 'RRULE:FREQ=WEEKLY;BYDAY=' + [1, 2, 3, 4, 5, 6, 0].filter(d => days.includes(d)).map(d => GIORNI_ICS[d]).join(',');
}

// Primo giorno previsto a partire da `da` (compreso): l'evento inizia da lì.
export function primoGiorno(days, da = new Date()) {
  for (let i = 0; i < 7; i++) { const g = addDays(da, i); if (days.includes(g.getDay())) return g; }
  return da;
}

// data e ora "locali" nel formato dei calendari: 20260924T200000 (senza fuso: vale l'ora del telefono)
export function dataOra(g, ora) {
  const [h, m] = ora.split(':').map(Number);
  return `${g.getFullYear()}${pad(g.getMonth() + 1)}${pad(g.getDate())}T${pad(h)}${pad(m)}00`;
}
function fine(g, ora, durata) {
  const [h, m] = ora.split(':').map(Number);
  const f = new Date(g); f.setHours(h, m + durata, 0, 0);
  return dataOra(f, `${pad(f.getHours())}:${pad(f.getMinutes())}`);
}

function descrizione(h, url) {
  const obiettivo = h.type === 'qty' ? `Obiettivo: ${fmt(h.target)} ${h.unit}. ` : '';
  return `${obiettivo}Segna quando l'hai fatto su Le mie abitudini: ${url}`;
}

// Link di Google Calendar con l'evento compilato (il fuso è quello del telefono)
export function linkGoogle(h, { ora, durata, da = new Date(), url, fuso }) {
  const g = primoGiorno(h.days, da);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: h.name,
    dates: `${dataOra(g, ora)}/${fine(g, ora, durata)}`,
    details: descrizione(h, url),
    recur: regolaRipetizione(h.days)
  });
  if (fuso) p.set('ctz', fuso);
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

// Nel formato .ics virgole, punti e virgola, "\" e a capo vanno "protetti" con "\"
export function testoIcs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
// Le righe del formato .ics non devono superare 75 byte: le più lunghe si spezzano e la
// continuazione inizia con uno spazio ("folding"). Si contano i byte, non le lettere,
// perché una lettera accentata (à, è…) occupa 2 byte.
const byte = ch => new TextEncoder().encode(ch).length;
export function piega(riga) {
  const out = [];
  let cur = '', n = 0;
  for (const ch of riga) {
    const b = byte(ch);
    if (n + b > 74) { out.push(cur); cur = ' '; n = 1; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join('\r\n');
}

// Contenuto del file .ics. avviso = minuti prima dell'evento (0 = all'inizio, null = nessun avviso)
export function creaIcs(h, { ora, durata, avviso, da = new Date(), url, adesso = new Date() }) {
  const g = primoGiorno(h.days, da);
  const utc = adesso.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const righe = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Le mie abitudini//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${h.id}-${ora.replace(':', '')}@le-mie-abitudini`,
    `DTSTAMP:${utc}`,
    `DTSTART:${dataOra(g, ora)}`,
    `DTEND:${fine(g, ora, durata)}`,
    regolaRipetizione(h.days),
    `SUMMARY:${testoIcs(h.name)}`,
    `DESCRIPTION:${testoIcs(descrizione(h, url))}`,
    `URL:${url}`
  ];
  if (avviso !== null && avviso !== undefined) {
    righe.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${testoIcs(h.name)}`, `TRIGGER:-PT${avviso}M`, 'END:VALARM');
  }
  righe.push('END:VEVENT', 'END:VCALENDAR');
  return righe.map(piega).join('\r\n') + '\r\n';
}
