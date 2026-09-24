// Il pannello per creare o modificare un'abitudine.
// Si lavora su una copia (ui.form): i dati veri cambiano solo premendo "Salva" (vedi app.js).
import { todayKey, esc, DAYS, DAYS_FULL, DAY_ORDER } from './utili.js';
import { ui } from './stato.js';
import { icon } from './icone.js';

let opener = null; // il pulsante che ha aperto il pannello: ci torna il focus alla chiusura

export function openForm(h) {
  opener = document.activeElement;
  ui.form = h ? JSON.parse(JSON.stringify(h)) : { id: null, name: '', type: 'check', target: 1, unit: '', step: 1, days: [0, 1, 2, 3, 4, 5, 6], created: todayKey() };
  renderForm();
  // il cursore va subito nel campo del nome (per una nuova abitudine) o sul pannello
  const first = document.getElementById(h ? 'f-title' : 'f-name');
  if (first) first.focus();
}

export function renderForm() {
  const f = ui.form, q = f.type === 'qty';
  // come in render(): ricordiamo quale giorno aveva il focus per ridarglielo
  const a = document.activeElement, focusDay = a && a.dataset && a.dataset.act === 'fday' ? a.dataset.d : null;
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="f-title">
    <div class="row"><h1 class="grow" id="f-title" tabindex="-1">${f.id ? 'Modifica' : 'Nuova'} abitudine</h1><button class="ibtn" data-act="closeForm" aria-label="Chiudi">${icon('x')}</button></div>
    <label for="f-name">Nome</label><input type="text" id="f-name" value="${esc(f.name)}" placeholder="es. Lettura" maxlength="40" autocomplete="off">
    <label for="f-type">Tipo</label>
    <select id="f-type"><option value="check" ${!q ? 'selected' : ''}>Sì / No (fatta o no)</option><option value="qty" ${q ? 'selected' : ''}>Quantità (con obiettivo)</option></select>
    ${q ? `<label for="f-target">Obiettivo giornaliero</label><input type="number" inputmode="decimal" id="f-target" value="${f.target}" min="0" step="any">
    <label for="f-unit">Unità</label><input type="text" id="f-unit" value="${esc(f.unit)}" placeholder="es. L, ore, pagine" maxlength="12" autocomplete="off">
    <label for="f-step">Quanto cambia ogni tocco su + e −</label><input type="number" inputmode="decimal" id="f-step" value="${f.step}" min="0" step="any">` : ''}
    <label id="f-days-l">Giorni in cui va fatta</label>
    <div class="days" role="group" aria-labelledby="f-days-l">${DAY_ORDER.map(d => `<button data-act="fday" data-d="${d}" class="${f.days.includes(d) ? 'on' : ''}" aria-pressed="${f.days.includes(d)}" aria-label="${DAYS_FULL[d]}">${DAYS[d][0]}</button>`).join('')}</div>
    <div class="quick"><button class="linkbtn" data-act="fall">Tutti i giorni</button><button class="linkbtn" data-act="fwork">Lun–Ven</button></div>
    <button class="btn block" data-act="saveForm" style="margin-top:20px">Salva</button>
    ${f.id ? '<button class="btn danger block" data-act="delete">Elimina abitudine</button>' : ''}
  </div></div>`;
  if (focusDay !== null) document.querySelector(`[data-act="fday"][data-d="${focusDay}"]`).focus();
}

// copia i campi correnti in ui.form prima di ridisegnare il pannello,
// altrimenti quello che l'utente ha scritto andrebbe perso
export function syncForm() {
  const g = id => document.getElementById(id);
  if (!g('f-name')) return;
  ui.form.name = g('f-name').value;
  if (g('f-target')) {
    ui.form.target = parseFloat(String(g('f-target').value).replace(',', '.')) || 0;
    ui.form.unit = g('f-unit').value;
    ui.form.step = parseFloat(String(g('f-step').value).replace(',', '.')) || 1;
  }
}

export function closeForm() {
  ui.form = null;
  document.getElementById('modal').innerHTML = '';
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}
