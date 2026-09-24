'use strict';
const VERSION = '1.0';
const STORE = 'abitudini.v1';
const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']; // indice = Date.getDay()
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // mostrati da lunedì
const DAYS_FULL = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

// ---------- dati ----------
function todayKey() { return keyOf(new Date()); }
function pad(n) { return String(n).padStart(2, '0'); }
function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dateOf(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function uid() { return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

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
let data = load();
function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.habits)) return d; }
  } catch (e) {}
  return defaultData();
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { alert('Impossibile salvare i dati: memoria del browser piena o bloccata.'); }
}

// ---------- logica ----------
function getVal(hid, k) { return (data.logs[k] && data.logs[k][hid]) || 0; }
function setVal(hid, k, v) {
  v = Math.max(0, Math.round(v * 100) / 100);
  if (!data.logs[k]) data.logs[k] = {};
  if (v === 0) { delete data.logs[k][hid]; if (!Object.keys(data.logs[k]).length) delete data.logs[k]; }
  else data.logs[k][hid] = v;
  save();
}
function goal(h) { return h.type === 'check' ? 1 : h.target; }
function isDone(h, k) { return getVal(h.id, k) >= goal(h) - 1e-9; }
function scheduled(h, d) { return h.days.includes(d.getDay()) && keyOf(d) >= h.created; }
function streak(h) {
  let d = new Date(), n = 0;
  if (scheduled(h, d) && !isDone(h, keyOf(d))) d = addDays(d, -1);
  for (let i = 0; i < 800; i++, d = addDays(d, -1)) {
    if (keyOf(d) < h.created) break;
    if (!h.days.includes(d.getDay())) continue;
    if (isDone(h, keyOf(d))) n++; else break;
  }
  return n;
}
function rate(h, from, to) { // % di giorni previsti completati tra from e to (inclusi)
  let tot = 0, ok = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    if (!scheduled(h, d)) continue;
    tot++; if (isDone(h, keyOf(d))) ok++;
  }
  return tot ? Math.round(ok / tot * 100) : null;
}
function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function fmt(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function daysLabel(h) {
  if (h.days.length === 7) return 'ogni giorno';
  if (!h.days.length) return 'nessun giorno';
  return DAY_ORDER.filter(d => h.days.includes(d)).map(d => DAYS[d]).join(' ');
}

// ---------- stato UI ----------
let tab = 'oggi';
let viewKey = todayKey();

// ---------- render ----------
function render() {
  const app = document.getElementById('app');
  app.innerHTML = tab === 'oggi' ? viewOggi() : tab === 'stat' ? viewStat() : viewHabits();
  document.getElementById('tabs').innerHTML = [['oggi', '✔', 'Oggi'], ['stat', '📊', 'Statistiche'], ['hab', '⚙', 'Abitudini']]
    .map(([id, ic, l]) => `<button data-act="tab" data-id="${id}" class="${tab === id ? 'on' : ''}"><span>${ic}</span>${l}</button>`).join('');
}

function backupBanner() {
  if (!Object.keys(data.logs).length) return '';
  const last = data.lastBackup ? dateOf(data.lastBackup) : null;
  const days = last ? Math.floor((Date.now() - last) / 864e5) : 999;
  if (days < 30) return '';
  return `<div class="banner">Non fai un backup ${last ? 'da ' + days + ' giorni' : 'da sempre'}. I dati sono solo su questo telefono. <a href="#" data-act="export" style="color:var(--accent);font-weight:600">Esporta ora</a></div>`;
}

function viewOggi() {
  const d = dateOf(viewKey), isToday = viewKey === todayKey();
  const label = isToday ? 'Oggi' : viewKey === keyOf(addDays(new Date(), -1)) ? 'Ieri' : DAYS_FULL[d.getDay()];
  const list = data.habits.filter(h => scheduled(h, d));
  const hidden = data.habits.length - list.length;
  const doneN = list.filter(h => isDone(h, viewKey)).length;
  let html = `<h1>${label}</h1>
  <div class="datebar">
    <button class="ibtn" data-act="day" data-n="-1" aria-label="Giorno prima">‹</button>
    <div class="d">${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</div>
    <button class="ibtn" data-act="day" data-n="1" aria-label="Giorno dopo" ${isToday ? 'disabled style="opacity:.35"' : ''}>›</button>
  </div>`;
  if (!isToday) html += `<button class="btn sec block" data-act="goToday" style="margin:0 0 6px">Torna a oggi</button>`;
  html += backupBanner();
  if (list.length) html += `<p class="muted" style="margin:6px 0">${doneN} di ${list.length} completate</p>`;
  if (!data.habits.length) html += `<div class="empty">Nessuna abitudine. Creane una dalla scheda “Abitudini”.</div>`;
  else if (!list.length) html += `<div class="empty">Nessuna abitudine prevista per questo giorno.</div>`;
  for (const h of list) html += cardOggi(h);
  if (hidden > 0 && list.length) html += `<p class="muted" style="text-align:center">${hidden} ${hidden === 1 ? 'abitudine non prevista' : 'abitudini non previste'} in questo giorno</p>`;
  return html;
}

function cardOggi(h) {
  const v = getVal(h.id, viewKey), s = streak(h);
  const badge = s > 0 ? `<span class="badge">🔥 ${s}</span>` : '';
  if (h.type === 'check') {
    return `<div class="card row">
      <button class="check ${v ? 'on' : ''}" data-act="toggle" data-id="${h.id}" aria-label="Segna come fatta">✓</button>
      <div class="grow"><div class="title">${esc(h.name)}</div><div class="muted">${daysLabel(h)}</div></div>${badge}</div>`;
  }
  const pct = Math.min(100, Math.round(v / h.target * 100));
  return `<div class="card">
    <div class="row"><div class="grow"><div class="title">${esc(h.name)}</div><div class="muted">obiettivo ${fmt(h.target)} ${esc(h.unit)} · ${daysLabel(h)}</div></div>${badge}</div>
    <div class="qty">
      <button class="ibtn" data-act="dec" data-id="${h.id}" aria-label="Meno">−</button>
      <button class="val" data-act="edit-val" data-id="${h.id}">${fmt(v)} <small>/ ${fmt(h.target)} ${esc(h.unit)}</small></button>
      <button class="ibtn" data-act="inc" data-id="${h.id}" aria-label="Più">+</button>
    </div>
    <div class="bar"><i style="width:${pct}%"></i></div></div>`;
}

function viewStat() {
  if (!data.habits.length) return `<h1>Statistiche</h1><div class="empty">Nessuna abitudine da mostrare.</div>`;
  const now = new Date(), ws = weekStart(now), ms = new Date(now.getFullYear(), now.getMonth(), 1);
  let html = `<h1>Statistiche</h1><p class="muted">Contano solo i giorni in cui l’abitudine era prevista.</p>`;
  for (const h of data.habits) {
    const w = rate(h, ws, now), m = rate(h, ms, now);
    let cells = '';
    for (let i = 27; i >= 0; i--) {
      const d = addDays(now, -i), k = keyOf(d);
      let c = '';
      if (scheduled(h, d)) c = isDone(h, k) ? 'done' : (i === 0 ? '' : 'miss');
      cells += `<i class="${c}${i === 0 ? ' today' : ''}" title="${k}"></i>`;
    }
    html += `<div class="card">
      <div class="title">${esc(h.name)}</div><div class="muted">${daysLabel(h)}</div>
      <div class="stats">
        <div><b>${streak(h)}</b><span>serie attuale</span></div>
        <div><b>${w === null ? '–' : w + '%'}</b><span>questa settimana</span></div>
        <div><b>${m === null ? '–' : m + '%'}</b><span>questo mese</span></div>
      </div>
      <div class="heat">${cells}</div>
      <div class="muted" style="margin-top:6px;font-size:12px">Ultimi 28 giorni: pieno = fatta, rosso = saltata, vuoto = non prevista</div>
    </div>`;
  }
  return html;
}

function viewHabits() {
  let html = `<h1>Abitudini</h1><button class="btn block" data-act="new" style="margin:10px 0 4px">+ Nuova abitudine</button>`;
  for (const h of data.habits) {
    html += `<div class="card row"><div class="grow"><div class="title">${esc(h.name)}</div>
      <div class="muted">${h.type === 'check' ? 'Sì / No' : 'Obiettivo ' + fmt(h.target) + ' ' + esc(h.unit)} · ${daysLabel(h)}</div></div>
      <button class="btn sec" data-act="edit" data-id="${h.id}">Modifica</button></div>`;
  }
  html += `<h2>Dati</h2><div class="card">
    <div class="muted">I dati restano solo su questo dispositivo. Fai un backup ogni tanto.</div>
    <div class="muted" style="margin-top:4px">Ultimo backup: ${data.lastBackup ? esc(data.lastBackup) : 'mai'}</div>
    <button class="btn block" data-act="export">Esporta backup (JSON)</button>
    <button class="btn sec block" data-act="import">Importa backup</button></div>
    <p class="muted" style="text-align:center">Abitudini v${VERSION}</p>`;
  return html;
}

// ---------- modale modifica ----------
let form = null;
function openForm(h) {
  form = h ? JSON.parse(JSON.stringify(h)) : { id: null, name: '', type: 'check', target: 1, unit: '', step: 1, days: [0, 1, 2, 3, 4, 5, 6], created: todayKey() };
  renderForm();
}
function renderForm() {
  const f = form, q = f.type === 'qty';
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
function syncForm() { // copia i campi correnti in `form` prima di ridisegnare
  const g = id => document.getElementById(id);
  if (!g('f-name')) return;
  form.name = g('f-name').value;
  if (g('f-target')) {
    form.target = parseFloat(String(g('f-target').value).replace(',', '.')) || 0;
    form.unit = g('f-unit').value;
    form.step = parseFloat(String(g('f-step').value).replace(',', '.')) || 1;
  }
}
function closeForm() { form = null; document.getElementById('modal').innerHTML = ''; }

// ---------- backup ----------
function exportBackup() {
  data.lastBackup = todayKey(); save();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'abitudini-backup-' + todayKey() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  render();
}
document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.habits) || typeof d.logs !== 'object') throw new Error();
      if (!confirm('Importare il backup? Sostituisce tutti i dati attuali.')) return;
      data = d; save(); render();
    } catch (err) { alert('File non valido: non sembra un backup di Abitudini.'); }
  };
  r.readAsText(file);
});

// ---------- eventi ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  const h = id ? data.habits.find(x => x.id === id) : null;
  if (['export', 'fall', 'fwork'].includes(act) || el.tagName === 'A') e.preventDefault();
  if (act === 'closeBg') { if (e.target === el) closeForm(); return; }
  switch (act) {
    case 'tab': tab = id; render(); window.scrollTo(0, 0); break;
    case 'day': {
      const nd = addDays(dateOf(viewKey), Number(el.dataset.n));
      if (keyOf(nd) <= todayKey()) { viewKey = keyOf(nd); render(); }
      break;
    }
    case 'goToday': viewKey = todayKey(); render(); break;
    case 'toggle': setVal(id, viewKey, getVal(id, viewKey) ? 0 : 1); render(); break;
    case 'inc': setVal(id, viewKey, getVal(id, viewKey) + h.step); render(); break;
    case 'dec': setVal(id, viewKey, getVal(id, viewKey) - h.step); render(); break;
    case 'edit-val': {
      const r = prompt(`${h.name}: quanto hai fatto? (${h.unit})`, fmt(getVal(id, viewKey)));
      if (r !== null) { const n = parseFloat(r.replace(',', '.')); if (!isNaN(n) && n >= 0) { setVal(id, viewKey, n); render(); } }
      break;
    }
    case 'new': openForm(null); break;
    case 'edit': openForm(h); break;
    case 'closeForm': closeForm(); break;
    case 'fday': {
      syncForm(); const d = Number(el.dataset.d);
      form.days = form.days.includes(d) ? form.days.filter(x => x !== d) : form.days.concat(d);
      renderForm(); break;
    }
    case 'fall': syncForm(); form.days = [0, 1, 2, 3, 4, 5, 6]; renderForm(); break;
    case 'fwork': syncForm(); form.days = [1, 2, 3, 4, 5]; renderForm(); break;
    case 'saveForm': {
      syncForm();
      const f = form;
      if (!f.name.trim()) { alert('Scrivi un nome.'); break; }
      if (!f.days.length) { alert('Scegli almeno un giorno.'); break; }
      if (f.type === 'qty') {
        if (!(f.target > 0)) { alert('L’obiettivo deve essere maggiore di zero.'); break; }
        if (!(f.step > 0)) f.step = 1;
      } else { f.target = 1; f.step = 1; f.unit = ''; }
      f.name = f.name.trim();
      if (f.id) { const i = data.habits.findIndex(x => x.id === f.id); data.habits[i] = f; }
      else { f.id = uid(); data.habits.push(f); }
      save(); closeForm(); render(); break;
    }
    case 'delete':
      if (confirm(`Eliminare “${form.name}” e tutto il suo storico?`)) {
        const hid = form.id;
        data.habits = data.habits.filter(x => x.id !== hid);
        for (const k of Object.keys(data.logs)) { delete data.logs[k][hid]; if (!Object.keys(data.logs[k]).length) delete data.logs[k]; }
        save(); closeForm(); render();
      }
      break;
    case 'export': exportBackup(); break;
    case 'import': document.getElementById('importFile').click(); break;
  }
});
// il tipo cambia i campi mostrati
document.addEventListener('change', e => {
  if (e.target.id === 'f-type' && form) {
    syncForm(); form.type = e.target.value;
    if (form.type === 'qty' && !(form.target > 1)) { form.target = form.target || 1; }
    renderForm();
  }
});
// se l'app resta aperta oltre la mezzanotte, torna a "oggi"
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !form && viewKey > todayKey()) { viewKey = todayKey(); }
  if (document.visibilityState === 'visible' && !form) render();
});

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
