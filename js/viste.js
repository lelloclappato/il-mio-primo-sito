// Le tre schermate (Oggi, Statistiche, Abitudini) e la barra in basso.
// Ogni funzione "view..." restituisce un pezzo di HTML come testo;
// render() lo inserisce nella pagina. I pulsanti hanno un attributo data-act
// che dice cosa fare al tocco: lo legge app.js.
import { keyOf, todayKey, dateOf, addDays, weekStart, fmt, esc, DAYS_FULL, MONTHS, APP_VERSION } from './utili.js';
import { data, getVal } from './dati.js';
import { scheduled, isDone, streak, rate, daysLabel } from './calcoli.js';
import { ui } from './stato.js';

export function render() {
  const app = document.getElementById('app');
  app.innerHTML = ui.tab === 'oggi' ? viewOggi() : ui.tab === 'stat' ? viewStat() : viewHabits();
  document.getElementById('tabs').innerHTML = [['oggi', '✔', 'Oggi'], ['stat', '📊', 'Statistiche'], ['hab', '⚙', 'Abitudini']]
    .map(([id, ic, l]) => `<button data-act="tab" data-id="${id}" class="${ui.tab === id ? 'on' : ''}"><span>${ic}</span>${l}</button>`).join('');
}

// avviso se non si fa un backup da più di 30 giorni
function backupBanner() {
  if (!Object.keys(data.logs).length) return '';
  const last = data.lastBackup ? dateOf(data.lastBackup) : null;
  const days = last ? Math.floor((Date.now() - last) / 864e5) : 999;
  if (days < 30) return '';
  return `<div class="banner">Non fai un backup ${last ? 'da ' + days + ' giorni' : 'da sempre'}. I dati sono solo su questo telefono. <a href="#" data-act="export" style="color:var(--accent);font-weight:600">Esporta ora</a></div>`;
}

// ---------- Oggi ----------
function viewOggi() {
  const d = dateOf(ui.viewKey), isToday = ui.viewKey === todayKey();
  const label = isToday ? 'Oggi' : ui.viewKey === keyOf(addDays(new Date(), -1)) ? 'Ieri' : DAYS_FULL[d.getDay()];
  const list = data.habits.filter(h => scheduled(h, d));
  const hidden = data.habits.length - list.length;
  const doneN = list.filter(h => isDone(h, ui.viewKey)).length;
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

// scheda di una singola abitudine in "Oggi"
function cardOggi(h) {
  const v = getVal(h.id, ui.viewKey), s = streak(h);
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

// ---------- Statistiche ----------
function viewStat() {
  if (!data.habits.length) return `<h1>Statistiche</h1><div class="empty">Nessuna abitudine da mostrare.</div>`;
  const now = new Date(), ws = weekStart(now), ms = new Date(now.getFullYear(), now.getMonth(), 1);
  let html = `<h1>Statistiche</h1><p class="muted">Contano solo i giorni in cui l’abitudine era prevista.</p>`;
  for (const h of data.habits) {
    const w = rate(h, ws, now), m = rate(h, ms, now);
    // griglia degli ultimi 28 giorni, dal più vecchio a oggi
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

// ---------- Abitudini ----------
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
    <p class="muted" style="text-align:center">Abitudini v${APP_VERSION}</p>`;
  return html;
}
