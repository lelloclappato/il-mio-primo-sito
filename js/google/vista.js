// Schermate del collegamento a Google Calendar:
// - scheda "Google Calendar" nella scheda Abitudini (collega, riepilogo sì/no, scollega)
// - in "Oggi": impegni di oggi e spazi liberi, con "Crea fascia" per le abitudini
// - sincronizzazione del riepilogo giornaliero quando segni le abitudini
// Tutto è facoltativo: se Google non è configurato, non è collegato o dà errore, l'app funziona come sempre.
import { esc, todayKey, dateOf } from '../utili.js';
import { data, save } from '../dati.js';
import { scheduled, isDone } from '../calcoli.js';
import { icon } from '../icone.js';
import { GIORNATA } from './config.js';
import * as G from './api.js';
import { normalizzaEvento, spaziLiberi, daQuando, minuti, riepilogo, idRiepilogo } from './fasce.js';

// stato in memoria (non salvato): impegni di oggi già scaricati, errori, durata scelta per le fasce
const stato = { k: null, eventi: null, errore: '', carico: false, durata: 30, msg: '' };
let ridisegna = () => {};
export function setupGoogle(fn) { ridisegna = fn; }

const impostazioni = () => data.settings.google;

// ---------- scheda nella schermata Abitudini ----------
export function cardGoogle() {
  let body;
  if (!G.configurato()) {
    body = `<p class="muted" style="margin:6px 0 0">Il collegamento non è ancora configurato. Servono alcuni passaggi nella
      Google Cloud Console: sono spiegati nel file <strong>docs/google-calendar.md</strong> del progetto.</p>`;
  } else if (!G.collegato()) {
    body = `<p class="muted" style="margin:6px 0 0">Collegando il tuo account vedrai gli impegni di oggi in “Oggi” e potrai creare
      una fascia per le abitudini negli spazi liberi.</p>
      <details class="info"><summary>Quali permessi chiede?</summary>
        <p><strong>Leggere gli eventi</strong> (solo lettura): per mostrare gli impegni di oggi. Non può modificare niente.</p>
        <p><strong>Gestire solo i calendari creati da questa app</strong>: chiesto solo la prima volta che crei una fascia o attivi il riepilogo.
        L’app crea un calendario a parte, “Le mie abitudini”, e scrive solo lì: gli altri tuoi calendari restano intoccabili.</p>
        <p>Il collegamento dura circa un’ora e resta solo in memoria: chiudendo l’app sparisce. Puoi revocarlo in ogni momento
        da myaccount.google.com → Sicurezza → App di terze parti.</p>
      </details>
      <button class="btn block" data-act="gCollega">${icon('calendar', 20)}Collega Google Calendar</button>`;
  } else {
    body = `<p style="margin:6px 0 0">${icon('check', 18).replace('class="ico"', 'class="ico inline ok"')} Collegato. Gli impegni di oggi compaiono in “Oggi”.</p>
      <label class="switch-row"><input type="checkbox" id="g-riepilogo" ${impostazioni().riepilogo ? 'checked' : ''}>
        <span>Segna ogni giorno il riepilogo delle abitudini sul calendario “Le mie abitudini”</span></label>
      <p class="muted small" style="margin:0">Un solo evento “tutto il giorno” (es. “Abitudini 3/4”), aggiornato mentre spunti,
        solo mentre l’app è collegata.</p>
      <button class="btn sec block" data-act="gScollega">Scollega</button>`;
  }
  return `<h2>Google Calendar</h2><div class="card">${body}${stato.msg ? `<p class="small g-msg" role="status">${esc(stato.msg)}</p>` : ''}</div>`;
}

// ---------- in "Oggi": impegni e spazi liberi ----------
export function cardImpegni() {
  if (!G.configurato()) return '';
  if (!G.collegato()) {
    // chi l'ha già usato vede un pulsante discreto per ricollegarsi (il collegamento non viene salvato)
    return impostazioni().usato
      ? `<button class="goal-cta g-ricollega" data-act="gCollega">${icon('calendar', 20)}<span><b>Mostra gli impegni di oggi</b><small>Ricollega Google Calendar</small></span></button>` : '';
  }
  const k = todayKey();
  if (stato.k !== k && !stato.carico) caricaImpegni(k);
  let body;
  if (stato.errore) body = `<p class="muted small">${esc(stato.errore)}</p>`;
  else if (!stato.eventi) body = `<p class="muted small">Carico gli impegni…</p>`;
  else {
    const ev = stato.eventi.map(e => normalizzaEvento(e, k));
    const conOra = ev.filter(e => !e.tuttoIlGiorno), tutto = ev.filter(e => e.tuttoIlGiorno);
    const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    body = (tutto.length ? `<p class="small muted" style="margin:6px 0 0">Tutto il giorno: ${tutto.map(e => esc(e.titolo)).join(', ')}</p>` : '')
      + (conOra.length
        ? `<ul class="g-impegni">${conOra.map(e => `<li><span class="num">${hhmm(e.inizio)}–${hhmm(e.fine)}</span> ${esc(e.titolo)}</li>`).join('')}</ul>`
        : '<p class="small muted">Nessun impegno con orario oggi.</p>');
    const liberi = spaziLiberi(ev, { da: daQuando(new Date(), GIORNATA.inizio), a: minuti(GIORNATA.fine), durata: stato.durata }).slice(0, 3);
    body += `<div class="g-fasce"><label for="g-durata" class="small">Spazi liberi per le abitudini, da</label>
      <select id="g-durata">${[15, 30, 45, 60].map(m => `<option value="${m}" ${m === stato.durata ? 'selected' : ''}>${m} minuti</option>`).join('')}</select>
      ${liberi.length ? liberi.map(s => `<div class="row g-fascia"><span class="grow num">${s.inizio}–${s.fine}</span>
        <button class="btn sec" data-act="gFascia" data-ora="${s.inizio}">Crea fascia alle ${s.inizio}</button></div>`).join('')
        : '<p class="small muted">Oggi non restano spazi liberi abbastanza lunghi.</p>'}</div>`;
  }
  return `<section class="card" aria-labelledby="g-imp-t"><h2 id="g-imp-t" style="margin:0">Impegni di oggi</h2>${body}</section>`;
}

async function caricaImpegni(k) {
  stato.carico = true; stato.errore = '';
  try { stato.eventi = await G.eventiDelGiorno(k); stato.k = k; }
  catch (e) { stato.errore = e.message; stato.k = k; }
  stato.carico = false;
  ridisegna();
}

// ---------- azioni ----------
export async function collega() {
  stato.msg = '';
  try {
    await G.collega();
    impostazioni().usato = true; save();
    stato.k = null; // ricarica gli impegni
  } catch (e) { stato.msg = e.message; }
  ridisegna();
}

export function scollega() {
  G.scollega();
  stato.k = null; stato.eventi = null; stato.msg = 'Scollegato. Puoi ricollegarti quando vuoi.';
  ridisegna();
}

export function cambiaDurata(v) { stato.durata = Number(v) || 30; ridisegna(); }

// Crea nel calendario "Le mie abitudini" un evento "Abitudini" nello spazio libero scelto,
// con l'elenco delle abitudini di oggi che mancano.
export async function creaFascia(ora) {
  const oggi = new Date(), k = todayKey();
  const mancanti = data.habits.filter(h => scheduled(h, oggi) && !isDone(data, h, k)).map(h => '○ ' + h.name);
  try {
    const cal = await calendario();
    const inizio = dateOf(k); inizio.setMinutes(minuti(ora));
    const fine = new Date(inizio.getTime() + stato.durata * 60000);
    await G.creaEvento(cal, {
      titolo: 'Abitudini',
      descrizione: (mancanti.length ? 'Da fare:\n' + mancanti.join('\n') : 'Tutto già fatto: tempo libero!') + '\n\nCreato da Le mie abitudini',
      inizio, fine
    });
    stato.k = null; // ricarica: la fascia non compare tra gli impegni del calendario principale, ma gli spazi restano giusti
    return `Fascia creata alle ${ora} nel calendario “Le mie abitudini”.`;
  } catch (e) { return e.message; }
}

// ID del calendario dell'app: lo crea la prima volta e se lo ricorda. Una volta controllato
// che esiste, per il resto della sessione non lo ricontrolla (meno chiamate a Google).
let calVerificato = null;
async function calendario() {
  if (calVerificato && calVerificato === impostazioni().calendarId && G.puoScrivere()) return calVerificato;
  const id = await G.calendarioApp(impostazioni().calendarId);
  if (id !== impostazioni().calendarId) { impostazioni().calendarId = id; save(); }
  calVerificato = id;
  return id;
}

export async function attivaRiepilogo(on) {
  stato.msg = '';
  if (on) {
    try { await calendario(); impostazioni().riepilogo = true; save(); await sincronizza(todayKey()); }
    catch (e) { impostazioni().riepilogo = false; save(); stato.msg = e.message; }
  } else { impostazioni().riepilogo = false; save(); }
  ridisegna();
}

// Aggiorna il riepilogo di un giorno, se il riepilogo è attivo e l'app è collegata.
// Aspetta 2 secondi dall'ultimo tocco, per non chiamare Google a ogni spunta.
let timer = null;
export function riepilogoCambiato(k) {
  if (!impostazioni().riepilogo || !G.puoScrivere()) return;
  clearTimeout(timer);
  timer = setTimeout(() => sincronizza(k).catch(e => { stato.msg = e.message; ridisegna(); }), 2000);
}
async function sincronizza(k) {
  const cal = await calendario();
  await G.aggiornaRiepilogo(cal, idRiepilogo(k), k, riepilogo(data, k));
}
