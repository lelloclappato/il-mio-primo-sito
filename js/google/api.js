// Collegamento a Google Calendar con Google Identity Services (flusso "token", tutto nel browser).
//
// Come funziona:
// 1. Quando tocchi "Collega", l'app carica la libreria di Google (accounts.google.com/gsi/client).
// 2. Google mostra la sua finestra: accedi e decidi se concedere il permesso.
// 3. Se accetti, Google dà all'app un "token di accesso": una chiave temporanea (circa 1 ora)
//    che permette solo quello che hai autorizzato.
// 4. L'app usa il token per chiamare l'API del calendario (www.googleapis.com).
//
// SICUREZZA: il token resta SOLO in memoria (in questa variabile). Non va nel localStorage:
// chiudendo o ricaricando l'app sparisce, e per rivederlo serve ricollegarsi.
// Se qualcosa fallisce, le funzioni lanciano un errore con un messaggio in italiano:
// chi le chiama lo mostra, e il resto dell'app continua a funzionare.
import { GOOGLE_CLIENT_ID, SCOPE_LETTURA, SCOPE_SCRITTURA, NOME_CALENDARIO } from './config.js';
import { keyOf, addDays, dateOf } from '../utili.js';

let token = null;          // { valore, scadenza (ms), scope } oppure null
let client = null;         // il "token client" di Google, creato una volta sola
let attesa = null;         // la richiesta di token in corso

export const configurato = () => !!GOOGLE_CLIENT_ID;
export const collegato = () => !!token && Date.now() < token.scadenza - 60000;
export const puoScrivere = () => collegato() && token.scope.split(' ').includes(SCOPE_SCRITTURA);

// carica la libreria di Google una volta sola, solo quando serve
function caricaLibreria() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => ko(new Error('Non riesco a raggiungere Google: controlla la connessione.'));
    document.head.appendChild(s);
  });
}

// Chiede un token con i permessi indicati (Google mostra la sua finestra di consenso).
// include_granted_scopes: i permessi già concessi restano validi, se ne aggiungono solo di nuovi.
async function chiediToken(scope) {
  if (!configurato()) throw new Error('Il collegamento a Google non è ancora configurato.');
  await caricaLibreria();
  if (attesa) return attesa;
  attesa = new Promise((ok, ko) => {
    const oauth2 = window.google.accounts.oauth2;
    client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope,
      include_granted_scopes: true,
      callback: r => {
        if (r.error) return ko(new Error('Accesso non concesso.'));
        if (!oauth2.hasGrantedAllScopes(r, scope)) return ko(new Error('Il permesso richiesto non è stato concesso.'));
        token = { valore: r.access_token, scadenza: Date.now() + (Number(r.expires_in) || 3600) * 1000, scope: r.scope || scope };
        ok();
      },
      error_callback: e => ko(new Error(e && e.type === 'popup_closed' ? 'Hai chiuso la finestra di Google.' : 'Accesso a Google non riuscito.'))
    });
    client.requestAccessToken({ prompt: '' });
  }).finally(() => { attesa = null; });
  return attesa;
}

export const collega = () => chiediToken(SCOPE_LETTURA);
// il permesso di scrittura si chiede solo quando serve davvero (prima fascia o primo riepilogo)
export async function assicuraScrittura() { if (!puoScrivere()) await chiediToken(SCOPE_LETTURA + ' ' + SCOPE_SCRITTURA); }

// Scollega: revoca il token presso Google e lo dimentica.
export function scollega() {
  if (token && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(token.valore, () => {});
  token = null;
}

// chiamata all'API del calendario con il token
async function api(metodo, percorso, corpo) {
  if (!collegato()) throw new Error('Collegamento scaduto: tocca “Collega” per ricollegarti.');
  let r;
  try {
    r = await fetch('https://www.googleapis.com/calendar/v3' + percorso, {
      method: metodo,
      headers: { Authorization: 'Bearer ' + token.valore, ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
  } catch (e) { throw new Error('Google Calendar non risponde: controlla la connessione.'); }
  if (r.status === 401) { token = null; throw new Error('Collegamento scaduto: tocca “Collega” per ricollegarti.'); }
  if (!r.ok) { const e = new Error('Google Calendar ha risposto con un errore (' + r.status + ').'); e.status = r.status; throw e; }
  return r.status === 204 ? null : r.json();
}

// Eventi di oggi del calendario principale (i titoli servono per mostrarli in "Oggi").
export async function eventiDelGiorno(k) {
  const inizio = dateOf(k), fine = addDays(inizio, 1);
  const q = new URLSearchParams({ timeMin: inizio.toISOString(), timeMax: fine.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '50' });
  const r = await api('GET', '/calendars/primary/events?' + q);
  return (r && r.items) || [];
}

// ID del calendario "Le mie abitudini": se non esiste (o è stato cancellato) lo crea.
export async function calendarioApp(idSalvato) {
  await assicuraScrittura();
  if (idSalvato) {
    try { await api('GET', '/calendars/' + encodeURIComponent(idSalvato)); return idSalvato; }
    catch (e) { if (e.status !== 404 && e.status !== 403) throw e; }
  }
  let fuso = 'Europe/Rome';
  try { fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || fuso; } catch (e) {}
  const c = await api('POST', '/calendars', { summary: NOME_CALENDARIO, description: 'Fasce e riepiloghi creati dall’app Le mie abitudini', timeZone: fuso });
  return c.id;
}

// Crea un evento con orario nel calendario dell'app (inizio e fine come oggetti Date locali).
export function creaEvento(calId, { titolo, descrizione, inizio, fine }) {
  return api('POST', `/calendars/${encodeURIComponent(calId)}/events`, {
    summary: titolo, description: descrizione,
    start: { dateTime: inizio.toISOString() }, end: { dateTime: fine.toISOString() }
  });
}

// Riepilogo del giorno: evento "tutto il giorno" con un ID fisso, così si aggiorna invece di duplicarsi.
// null = quel giorno non c'era niente di previsto: il riepilogo (se c'era) viene tolto.
export async function aggiornaRiepilogo(calId, id, k, testo) {
  const percorso = `/calendars/${encodeURIComponent(calId)}/events`;
  if (!testo) {
    try { await api('DELETE', `${percorso}/${id}`); } catch (e) { if (e.status !== 404 && e.status !== 410) throw e; }
    return;
  }
  // "transparent" = non occupa tempo (non ti fa risultare occupato); "confirmed" = lo riattiva se era stato tolto
  const evento = { id, summary: testo.titolo, description: testo.descrizione, start: { date: k }, end: { date: keyOf(addDays(dateOf(k), 1)) },
    transparency: 'transparent', status: 'confirmed' };
  try { await api('PUT', `${percorso}/${id}`, evento); }
  catch (e) { if (e.status === 404) await api('POST', percorso, evento); else throw e; }
}
