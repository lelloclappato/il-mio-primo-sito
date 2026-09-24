// Le tre schermate (Oggi, Statistiche, Abitudini) e la barra in basso.
// Ogni funzione "view..." restituisce un pezzo di HTML come testo;
// render() lo inserisce nella pagina. I pulsanti hanno un attributo data-act
// che dice cosa fare al tocco: lo legge app.js.
import { keyOf, todayKey, dateOf, addDays, weekStart, fmt, esc, DAYS_FULL, MONTHS, APP_VERSION } from './utili.js';
import { data, getVal, getJournal, migrationNote } from './dati.js';
import { scheduled, isDone, serieAbitudine, serieComplessiva, percentuale, daysLabel } from './calcoli.js';
import { ui } from './stato.js';
import { icon } from './icone.js';

const TABS = [['oggi', 'check', 'Oggi'], ['stat', 'chart', 'Statistiche'], ['hab', 'settings', 'Abitudini']];

// i 5 livelli dell'umore: il numero (1-5) è quello che viene salvato
export const UMORI = ['Pessima', 'Giù', 'Così così', 'Bene', 'Ottima'];

export function render() {
  // render() sostituisce tutto l'HTML: ci segniamo quale pulsante aveva il focus
  // (chi usa la tastiera o un lettore di schermo) per rimetterlo sullo stesso pulsante dopo.
  const a = document.activeElement;
  const focusSel = a && a.dataset && a.dataset.act
    ? `[data-act="${a.dataset.act}"]` + (a.dataset.id ? `[data-id="${a.dataset.id}"]` : '') + (a.dataset.n ? `[data-n="${a.dataset.n}"]` : '')
    : null;

  document.getElementById('app').innerHTML = ui.tab === 'oggi' ? viewOggi() : ui.tab === 'stat' ? viewStat() : viewHabits();
  document.getElementById('tabs').innerHTML = TABS.map(([id, ic, l]) =>
    `<button data-act="tab" data-id="${id}" class="${ui.tab === id ? 'on' : ''}" ${ui.tab === id ? 'aria-current="page"' : ''}>
      <span class="pill-ico">${icon(ic)}</span>${l}</button>`).join('');

  if (focusSel) {
    let el = document.querySelector(focusSel);
    // se nel frattempo è disattivato (es. "−" arrivati a zero), si passa a un pulsante vicino
    if (el && el.disabled) el = el.parentElement.querySelector('button:not(:disabled)');
    if (el) el.focus();
  }
}

// Fa leggere un breve messaggio ai lettori di schermo (la zona #annuncio in index.html è invisibile).
export function annuncia(msg) {
  const el = document.getElementById('annuncio');
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 50); // svuotare e riscrivere fa ripetere anche lo stesso messaggio
}

// ---------- avvisi ----------
function banner(text, act, btn) {
  return `<div class="banner" role="status"><span>${text}</span><button class="linkbtn" data-act="${act}">${btn}</button></div>`;
}
// dopo che i dati sono stati spostati da una versione precedente dell'app
function migrationBanner() {
  return migrationNote ? banner(esc(migrationNote), 'dismissNote', 'Ok') : '';
}
// se non si fa un backup da più di 30 giorni
function backupBanner() {
  if (!Object.keys(data.logs).length) return '';
  const last = data.lastBackup ? dateOf(data.lastBackup) : null;
  const days = last ? Math.floor((Date.now() - last) / 864e5) : 999;
  if (days < 30) return '';
  return banner(`Non fai un backup ${last ? 'da ' + days + ' giorni' : 'da sempre'}. I dati sono solo su questo dispositivo.`, 'export', 'Esporta ora');
}

// messaggio quando non c'è niente da mostrare, con icona e (se serve) un pulsante
function empty(ic, title, text, btn) {
  return `<div class="empty">${icon(ic, 40)}<strong>${title}</strong><p>${text}</p>${btn || ''}</div>`;
}

// ---------- Oggi ----------
function viewOggi() {
  const d = dateOf(ui.viewKey), isToday = ui.viewKey === todayKey();
  const label = isToday ? 'Oggi' : ui.viewKey === keyOf(addDays(new Date(), -1)) ? 'Ieri' : DAYS_FULL[d.getDay()];
  const list = data.habits.filter(h => scheduled(h, d));
  const hidden = data.habits.length - list.length;
  const doneN = list.filter(h => isDone(data, h, ui.viewKey)).length;
  let html = `<h1>${label}</h1>
  <div class="datebar">
    <button class="ibtn" data-act="day" data-n="-1" aria-label="Giorno prima">${icon('chevronLeft')}</button>
    <div class="d">${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</div>
    <button class="ibtn" data-act="day" data-n="1" aria-label="Giorno dopo" ${isToday ? 'disabled' : ''}>${icon('chevronRight')}</button>
  </div>`;
  if (!isToday) html += `<button class="btn sec block" data-act="goToday" style="margin:0 0 6px">Torna a oggi</button>`;
  html += migrationBanner() + backupBanner();
  if (isToday && data.habits.length) html += heroSerie(doneN, list.length);
  else if (list.length) html += `<p class="muted num" style="margin:8px 0 4px">${doneN} di ${list.length} completate</p>`;

  if (!data.habits.length) {
    html += empty('sprout', 'Nessuna abitudine, per ora',
      'Aggiungi la prima: può essere piccola, come bere un bicchiere d’acqua.',
      `<button class="btn" data-act="newFromEmpty">${icon('plus', 20)}Crea un’abitudine</button>`);
  } else if (!list.length) {
    html += empty('calendarOff', 'Giorno libero', 'Nessuna abitudine è prevista per questo giorno.');
  }
  for (const h of list) html += cardOggi(h);
  if (hidden > 0 && list.length) html += `<p class="muted" style="text-align:center">${hidden} ${hidden === 1 ? 'abitudine non prevista' : 'abitudini non previste'} in questo giorno</p>`;
  if (data.habits.length) html += cardDiario();
  return html;
}

// Nota e umore del giorno mostrato. Entrambi facoltativi.
// La nota si salva da sola mentre scrivi (vedi app.js), non serve un pulsante.
function cardDiario() {
  const g = getJournal(ui.viewKey);
  const moods = UMORI.map((l, i) => {
    const v = i + 1, on = g.mood === v;
    return `<button class="mood ${on ? 'on' : ''}" data-act="mood" data-v="${v}" aria-pressed="${on}">${icon('mood' + v, 28)}<span>${l}</span></button>`;
  }).join('');
  return `<section class="card diario" aria-labelledby="diario-t">
    <h2 id="diario-t" style="margin:0 0 2px">Com’è andata?</h2>
    <div class="muted small">Facoltativo: umore e una nota per ricordare la giornata.</div>
    <div class="moods" role="group" aria-label="Umore della giornata">${moods}</div>
    <label for="nota-giorno" class="sr-only">Nota del giorno</label>
    <textarea id="nota-giorno" rows="3" maxlength="500" placeholder="Scrivi una nota (si salva da sola)">${esc(g.note || '')}</textarea>
  </section>`;
}

// Riquadro in cima a "Oggi": la serie complessiva (giorni di fila con tutte le abitudini previste
// completate) e l'avanzamento di oggi. I messaggi incoraggiano, non rimproverano.
function heroSerie(doneN, tot) {
  const { attuale, migliore } = serieComplessiva(data);
  const completa = tot > 0 && doneN === tot;
  let sotto;
  if (!tot) sotto = 'Oggi niente in programma: la serie resta al sicuro.';
  else if (completa) sotto = 'Giornata completa! La serie è salva.';
  else if (attuale === 0) sotto = 'Completa le abitudini di oggi per iniziare una nuova serie.';
  else sotto = `Completa le abitudini di oggi per arrivare a ${attuale + 1}.`;
  return `<section class="card hero" aria-label="Serie complessiva">
    <div class="row">
      <div class="hero-ico">${icon('flame', 28)}</div>
      <div class="grow">
        <div class="hero-num"><b class="num">${attuale}</b> ${attuale === 1 ? 'giorno' : 'giorni'} di fila</div>
        <div class="muted small">${migliore > attuale ? `Record: ${migliore} · ` : attuale > 0 ? 'È il tuo record · ' : ''}${sotto}</div>
      </div>
    </div>
    ${tot ? `<div class="hero-oggi"><span class="num">${doneN} di ${tot}</span> completate oggi
      <div class="bar ${completa ? 'full' : ''}" aria-hidden="true"><i style="width:${Math.round(doneN / tot * 100)}%"></i></div></div>` : ''}
  </section>`;
}

// scheda di una singola abitudine in "Oggi"
function cardOggi(h) {
  const v = getVal(h.id, ui.viewKey), s = serieAbitudine(data, h).attuale, name = esc(h.name);
  const badge = s > 0
    ? `<span class="badge" title="Serie: ${s} ${s === 1 ? 'giorno' : 'giorni'} di fila">${icon('flame', 16)}<span class="num">${s}</span><span class="sr-only"> ${s === 1 ? 'giorno' : 'giorni'} di fila</span></span>`
    : '';
  if (h.type === 'check') {
    const fatta = isDone(data, h, ui.viewKey);
    return `<div class="card row">
      <button class="check ${fatta ? 'on' : ''}" data-act="toggle" data-id="${h.id}" aria-pressed="${fatta}" aria-label="${name}: fatta">${icon('check', 28)}</button>
      <div class="grow"><div class="title">${name}</div><div class="muted">${daysLabel(h)}</div></div>${badge}</div>`;
  }
  const pct = Math.min(100, Math.round(v / h.target * 100));
  const unit = esc(h.unit);
  return `<div class="card">
    <div class="row"><div class="grow"><div class="title">${name}</div><div class="muted">obiettivo ${fmt(h.target)} ${unit} · ${daysLabel(h)}</div></div>${badge}</div>
    <div class="qty">
      <button class="ibtn" data-act="dec" data-id="${h.id}" aria-label="${name}: meno ${fmt(h.step)} ${unit}" ${v <= 0 ? 'disabled' : ''}>${icon('minus')}</button>
      <button class="val" data-act="edit-val" data-id="${h.id}" aria-label="${name}: ${fmt(v)} di ${fmt(h.target)} ${unit}. Tocca per scrivere il valore">${fmt(v)} <small>/ ${fmt(h.target)} ${unit}</small></button>
      <button class="ibtn" data-act="inc" data-id="${h.id}" aria-label="${name}: più ${fmt(h.step)} ${unit}">${icon('plus')}</button>
    </div>
    <div class="bar ${isDone(data, h, ui.viewKey) ? 'full' : ''}" aria-hidden="true"><i style="width:${pct}%"></i></div></div>`;
}

// ---------- Statistiche ----------
function viewStat() {
  if (!data.habits.length) return `<h1>Statistiche</h1>` + empty('chart', 'Ancora niente da mostrare', 'Le statistiche compaiono quando crei le tue abitudini.');
  const now = new Date(), ws = weekStart(now), ms = new Date(now.getFullYear(), now.getMonth(), 1);
  let html = `<h1>Statistiche</h1><p class="muted">Contano solo i giorni in cui l’abitudine era prevista.</p>`;
  for (const h of data.habits) {
    const w = percentuale(data, h, ws, now), m = percentuale(data, h, ms, now);
    // griglia degli ultimi 28 giorni, dal più vecchio a oggi
    let cells = '', nDone = 0, nMiss = 0;
    for (let i = 27; i >= 0; i--) {
      const d = addDays(now, -i), k = keyOf(d);
      let c = '';
      if (scheduled(h, d)) c = isDone(data, h, k) ? 'done' : (i === 0 ? '' : 'miss');
      if (c === 'done') nDone++; if (c === 'miss') nMiss++;
      cells += `<i class="${c}${i === 0 ? ' today' : ''}" title="${k}"></i>`;
    }
    html += `<div class="card">
      <div class="title">${esc(h.name)}</div><div class="muted">${daysLabel(h)}</div>
      <div class="stats">
        <div><b>${serieAbitudine(data, h).attuale}</b><span>serie attuale</span></div>
        <div><b>${w === null ? '–' : w + '%'}</b><span>questa settimana</span></div>
        <div><b>${m === null ? '–' : m + '%'}</b><span>questo mese</span></div>
      </div>
      <div class="heat" role="img" aria-label="Ultimi 28 giorni: ${nDone} fatti, ${nMiss} saltati">${cells}</div>
      <div class="legend" aria-hidden="true"><span><i class="done"></i>fatta</span><span><i class="miss"></i>saltata</span><span><i></i>non prevista</span></div>
    </div>`;
  }
  return html;
}

// ---------- Abitudini ----------
function viewHabits() {
  let html = `<h1>Abitudini</h1><button class="btn block" data-act="new" style="margin:10px 0 4px">${icon('plus', 20)}Nuova abitudine</button>`;
  if (!data.habits.length) html += `<p class="muted" style="text-align:center">Qui compariranno le abitudini che crei.</p>`;
  for (const h of data.habits) {
    html += `<div class="card row"><div class="grow"><div class="title">${esc(h.name)}</div>
      <div class="muted">${h.type === 'check' ? 'Sì / No' : 'Obiettivo ' + fmt(h.target) + ' ' + esc(h.unit)} · ${daysLabel(h)}</div></div>
      <button class="btn sec" data-act="edit" data-id="${h.id}" aria-label="Modifica ${esc(h.name)}">Modifica</button></div>`;
  }
  html += `<h2>Dati</h2><div class="card">
    <div class="muted">I dati restano solo su questo dispositivo. Fai un backup ogni tanto.</div>
    <div class="muted" style="margin-top:4px">Ultimo backup: ${data.lastBackup ? esc(data.lastBackup) : 'mai'}</div>
    <button class="btn block" data-act="export">${icon('download', 20)}Esporta backup (JSON)</button>
    <button class="btn sec block" data-act="import">${icon('upload', 20)}Importa backup</button></div>
    <p class="muted small" style="text-align:center">Abitudini v${APP_VERSION}</p>`;
  return html;
}
