// Il pannello per creare o modificare un'abitudine.
// Si lavora su una copia (ui.form): i dati veri cambiano solo premendo "Salva" (vedi app.js).
import { todayKey, esc, DAYS, DAY_ORDER } from './utili.js';
import { ui } from './stato.js';

export function openForm(h) {
  ui.form = h ? JSON.parse(JSON.stringify(h)) : { id: null, name: '', type: 'check', target: 1, unit: '', step: 1, days: [0, 1, 2, 3, 4, 5, 6], created: todayKey() };
  renderForm();
}

export function renderForm() {
  const f = ui.form, q = f.type === 'qty';
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet">
    <div class="row"><h1 class="grow" style="margin:0">${f.id ? 'Modifica' : 'Nuova'} abitudine</h1><button class="ibtn" data-act="closeForm" aria-label="Chiudi">✕</button></div>
    <label for="f-name">Nome</label><input type="text" id="f-name" value="${esc(f.name)}" placeholder="es. Lettura" maxlength="40">
    <label for="f-type">Tipo</label>
    <select id="f-type"><option value="check" ${!q ? 'selected' : ''}>Sì / No (fatta o no)</option><option value="qty" ${q ? 'selected' : ''}>Quantità (con obiettivo)</option></select>
    ${q ? `<label for="f-target">Obiettivo giornaliero</label><input type="number" inputmode="decimal" id="f-target" value="${f.target}" min="0" step="any">
    <label for="f-unit">Unità</label><input type="text" id="f-unit" value="${esc(f.unit)}" placeholder="es. L, ore, pagine" maxlength="12">
    <label for="f-step">Quanto cambia ogni tocco su + e −</label><input type="number" inputmode="decimal" id="f-step" value="${f.step}" min="0" step="any">` : ''}
    <label>Giorni in cui va fatta</label>
    <div class="days">${DAY_ORDER.map(d => `<button data-act="fday" data-d="${d}" class="${f.days.includes(d) ? 'on' : ''}">${DAYS[d][0]}</button>`).join('')}</div>
    <div class="muted" style="margin-top:6px"><a href="#" data-act="fall" style="color:var(--accent)">Tutti</a> · <a href="#" data-act="fwork" style="color:var(--accent)">Lun–Ven</a></div>
    <button class="btn block" data-act="saveForm" style="margin-top:20px">Salva</button>
    ${f.id ? '<button class="btn danger block" data-act="delete">Elimina abitudine</button>' : ''}
  </div></div>`;
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

export function closeForm() { ui.form = null; document.getElementById('modal').innerHTML = ''; }
