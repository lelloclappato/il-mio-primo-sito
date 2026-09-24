// "Aggiungi al calendario" (Fase 4, passo A): nessun login, nessun permesso.
// Per un'abitudine crea un evento che si ripete negli stessi giorni della settimana, in due modi:
//  1. un link a Google Calendar con l'evento già compilato (lo salvi tu con un tocco);
//  2. un file .ics (formato standard dei calendari: Google, Apple, Outlook) con l'avviso incluso.
// Il testo degli eventi lo preparano le funzioni di ics.js; qui c'è il pannello.
import { keyOf, esc, DAYS_FULL, todayKey } from './utili.js';
import { ui } from './stato.js';
import { data } from './dati.js';
import { icon } from './icone.js';
import { primoGiorno, linkGoogle, creaIcs } from './ics.js';

// ---------- pannello "Aggiungi al calendario" ----------
const URL_APP = () => location.origin + location.pathname.replace(/index\.html$/, '');
const FUSO = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; } };
let opener = null;

export function openCal(hid) {
  opener = document.activeElement;
  ui.cal = { hid, ora: data.settings.reminder.time || '20:30', durata: 15, avviso: 10 };
  renderCal();
  document.getElementById('c-title').focus();
}

export function renderCal() {
  const c = ui.cal, h = data.habits.find(x => x.id === c.hid);
  const opzioni = (lista, v, fmtL) => lista.map(x => `<option value="${x}" ${x === v ? 'selected' : ''}>${fmtL(x)}</option>`).join('');
  const inizio = primoGiorno(h.days);
  const quando = h.days.length === 7 ? 'ogni giorno' : 'ogni ' + [1, 2, 3, 4, 5, 6, 0].filter(d => h.days.includes(d)).map(d => DAYS_FULL[d]).join(', ');
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="c-title">
    <div class="row"><h1 class="grow" id="c-title" tabindex="-1">Aggiungi al calendario</h1><button class="ibtn" data-act="calClose" aria-label="Chiudi">${icon('x')}</button></div>
    <p class="muted" style="margin:8px 0 0">Crea un evento “${esc(h.name)}” che si ripete ${quando},
      a partire da ${keyOf(inizio) === todayKey() ? 'oggi' : DAYS_FULL[inizio.getDay()] + ' ' + inizio.getDate()}.
      L’avviso arriva dal calendario del telefono, anche con l’app chiusa.</p>
    <label for="c-ora">Orario</label><input type="time" id="c-ora" value="${c.ora}">
    <label for="c-durata">Durata</label>
    <select id="c-durata">${opzioni([5, 15, 30, 45, 60], c.durata, x => x + ' minuti')}</select>
    <label for="c-avviso">Avviso (solo con il file .ics)</label>
    <select id="c-avviso">${opzioni(['', 0, 5, 10, 30, 60], c.avviso === null ? '' : c.avviso, x => x === '' ? 'Nessun avviso' : x === 0 ? 'All’inizio' : x + ' minuti prima')}</select>
    <button class="btn block" data-act="calGoogle" style="margin-top:20px">${icon('calendar', 20)}Apri in Google Calendar</button>
    <button class="btn sec block" data-act="calIcs">${icon('download', 20)}Scarica il file .ics</button>
    <p class="muted small" style="margin:10px 0 0"><strong>Google Calendar</strong>: si apre l’evento già compilato, controlla e tocca “Salva”
      (l’avviso sarà quello predefinito del tuo calendario).<br><strong>File .ics</strong>: aprilo sul telefono (iPhone: “Aggiungi al calendario”;
      Android: si apre con l’app Calendario) oppure importalo in Google Calendar dal computer.</p>
  </div></div>`;
}

export function syncCal() {
  const g = id => document.getElementById(id);
  if (!g('c-ora')) return;
  if (/^\d{2}:\d{2}$/.test(g('c-ora').value)) ui.cal.ora = g('c-ora').value;
  ui.cal.durata = Number(g('c-durata').value);
  ui.cal.avviso = g('c-avviso').value === '' ? null : Number(g('c-avviso').value);
}

export function apriGoogle() {
  syncCal();
  const h = data.habits.find(x => x.id === ui.cal.hid);
  window.open(linkGoogle(h, { ...ui.cal, url: URL_APP(), fuso: FUSO() }), '_blank', 'noopener');
}

export function scaricaIcs() {
  syncCal();
  const h = data.habits.find(x => x.id === ui.cal.hid);
  const blob = new Blob([creaIcs(h, { ...ui.cal, url: URL_APP() })], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = h.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() + '.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function closeCal() {
  ui.cal = null;
  document.getElementById('modal').innerHTML = '';
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}
