// Le tre schermate (Oggi, Statistiche, Abitudini) e la barra in basso.
// Ogni funzione "view..." restituisce un pezzo di HTML come testo;
// render() lo inserisce nella pagina. I pulsanti hanno un attributo data-act
// che dice cosa fare al tocco: lo legge app.js.
import { keyOf, todayKey, dateOf, addDays, weekStart, fmt, esc, DAYS_FULL, MONTHS, APP_VERSION } from './utili.js';
import { data, getVal, getJournal, migrationNote } from './dati.js';
import { scheduled, isDone, serieAbitudine, serieComplessiva, percentuale, percentualeComplessiva, piuCostante, livelloGiorno, umoreEAbitudini, daysLabel } from './calcoli.js';
import { ui } from './stato.js';
import { icon } from './icone.js';
import { hasPrimaImport } from './backup.js';

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
  const serie = serieComplessiva(data, now);
  const w = percentualeComplessiva(data, ws, now, now), m = percentualeComplessiva(data, ms, now, now);
  const top = piuCostante(data, now);
  const pct = v => v === null ? '–' : v + '%';

  let html = `<h1>Statistiche</h1><p class="muted">Contano solo i giorni in cui le abitudini erano previste. Oggi conta solo se è già fatto.</p>
  <section class="card" aria-labelledby="st-gen"><h2 id="st-gen" style="margin:0">In generale</h2>
    <div class="stats four">
      <div><b>${serie.attuale}</b><span>serie attuale</span></div>
      <div><b>${serie.migliore}</b><span>serie migliore</span></div>
      <div><b>${pct(w)}</b><span>questa settimana</span></div>
      <div><b>${pct(m)}</b><span>questo mese</span></div>
    </div>
    <p class="top">${top
      ? `${icon('flame', 18)}<span>Abitudine più costante: <strong>${esc(top.h.name)}</strong>, ${top.pct}% negli ultimi 30 giorni</span>`
      : `<span class="muted">L’abitudine più costante comparirà dopo qualche giorno di dati.</span>`}</p>
  </section>`;
  html += calendario(now) + umoreCard(now);

  html += `<h2>Per abitudine</h2>`;
  for (const h of data.habits) {
    const s = serieAbitudine(data, h, now), hw = percentuale(data, h, ws, now, now), hm = percentuale(data, h, ms, now, now);
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
      <div class="stats four">
        <div><b>${s.attuale}</b><span>serie</span></div>
        <div><b>${s.migliore}</b><span>record</span></div>
        <div><b>${pct(hw)}</b><span>settimana</span></div>
        <div><b>${pct(hm)}</b><span>mese</span></div>
      </div>
      <div class="heat" role="img" aria-label="Ultimi 28 giorni: ${nDone} fatti, ${nMiss} saltati">${cells}</div>
      <div class="legend" aria-hidden="true"><span><i class="done"></i>fatta</span><span><i class="miss"></i>saltata</span><span><i></i>non prevista</span></div>
    </div>`;
  }
  return html;
}

// Griglia delle ultime settimane, stile "contributi di GitHub":
// ogni colonna è una settimana (da lunedì a domenica), ogni quadratino un giorno.
// Il colore dice quante abitudini previste sono state fatte: più è pieno, più ne hai fatte.
const SETTIMANE = 20;
const MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
function calendario(now) {
  const start = addDays(weekStart(now), -7 * (SETTIMANE - 1)), oggiK = keyOf(now);
  // La griglia si riempie per colonne: prima colonna = nomi dei giorni, poi una colonna per settimana.
  // Ogni colonna ha 8 caselle: in alto il mese (se inizia lì), sotto i 7 giorni da lunedì a domenica.
  let cells = ['', 'lun', '', 'mer', '', 'ven', '', 'dom'].map(t => `<span class="cal-l">${t}</span>`).join('');
  let completi = 0, conPrevisti = 0, meseVisto = -1;
  for (let w = 0; w < SETTIMANE; w++) {
    const lun = addDays(start, 7 * w);
    // etichetta del mese sopra la prima settimana di ogni mese (non nelle ultime 2 colonne: non c'è spazio)
    const nuovoMese = lun.getMonth() !== meseVisto && w <= SETTIMANE - 3;
    cells += `<span class="cal-l cal-m">${nuovoMese ? MESI_BREVI[lun.getMonth()] : ''}</span>`;
    meseVisto = lun.getMonth();
    for (let r = 0; r < 7; r++) {
      const g = addDays(lun, r), k = keyOf(g);
      if (k > oggiK) { cells += '<i class="fut"></i>'; continue; } // giorni futuri: spazio vuoto
      const liv = livelloGiorno(data, g);
      let c = 'none', desc = 'niente previsto';
      if (liv !== null) {
        conPrevisti++; if (liv >= 1) completi++;
        c = liv >= 1 ? 'l3' : liv >= 0.5 ? 'l2' : liv > 0 ? 'l1' : 'l0';
        desc = Math.round(liv * 100) + '% fatto';
      }
      cells += `<i class="${c}${k === oggiK ? ' today' : ''}" title="${g.getDate()} ${MONTHS[g.getMonth()]}: ${desc}"></i>`;
    }
  }
  return `<section class="card" aria-labelledby="st-cal"><h2 id="st-cal" style="margin:0">Ultime ${SETTIMANE} settimane</h2>
    <div class="cal" role="img" style="grid-template-columns:auto repeat(${SETTIMANE}, minmax(0, 1fr))"
      aria-label="Ultime ${SETTIMANE} settimane: ${completi} giorni completi su ${conPrevisti} con abitudini previste">${cells}</div>
    <div class="legend" aria-hidden="true">meno <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> più
      <span style="margin-left:auto"><i class="none"></i>niente previsto</span></div>
  </section>`;
}

// Umore e abitudini: compare quando ci sono abbastanza giorni con l'umore segnato.
function umoreCard(now) {
  const r = umoreEAbitudini(data, now);
  const f = v => v === null ? '–' : fmt(Math.round(v * 10) / 10);
  let body;
  if (r.pieni.n < 3 || r.altri.n < 3) {
    body = `<p class="muted" style="margin:6px 0 0">Segna l’umore in “Oggi” per qualche giorno (servono almeno 3 giorni completi e 3 no):
      qui vedrai se va di pari passo con le tue abitudini.</p>`;
  } else {
    const best = r.abitudini[0];
    body = `<div class="stats">
        <div><b>${f(r.pieni.media)}</b><span>umore nei giorni completi</span></div>
        <div><b>${f(r.altri.media)}</b><span>negli altri giorni</span></div>
        <div><b>${r.giorniConUmore}</b><span>giorni con l’umore</span></div>
      </div>
      ${best && best.diff > 0.2 ? `<p class="top">${icon('mood4', 18)}<span>Nei giorni in cui fai <strong>${esc(best.h.name)}</strong> l’umore è più alto di ${f(best.diff)} punti.</span></p>` : ''}
      <p class="muted small" style="margin:8px 0 0">Umore da 1 (pessima) a 5 (ottima), ultimi 90 giorni. È un confronto, non una prova di causa ed effetto.</p>`;
  }
  return `<section class="card" aria-labelledby="st-umore"><h2 id="st-umore" style="margin:0">Umore e abitudini</h2>${body}</section>`;
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
    <button class="btn sec block" data-act="import">${icon('upload', 20)}Importa backup</button>
    ${hasPrimaImport() ? `<button class="btn sec block" data-act="undoImport">Annulla l’ultima importazione</button>` : ''}</div>
    <p class="muted small" style="text-align:center">Abitudini v${APP_VERSION}</p>`;
  return html;
}
