// Obiettivo di serie: "voglio arrivare a N giorni di fila", con un premio scelto da te
// oppure, se non lo scegli, una pillola di saggezza al traguardo.
//
// I giorni si contano da quando imposti l'obiettivo (vedi progressoObiettivo in calcoli.js).
// Se la serie si interrompe l'obiettivo resta: il conteggio riparte.
import { todayKey, esc } from './utili.js';
import { data, save } from './dati.js';
import { progressoObiettivo } from './calcoli.js';
import { PILLOLE } from './frasi.js';
import { ui } from './stato.js';
import { icon } from './icone.js';

// Le proposte, con una breve spiegazione. 66 = media dello studio di Lally (UCL, 2009).
export const PROPOSTE = [
  { giorni: 7, nome: 'Una settimana', nota: 'Per scaldarsi' },
  { giorni: 14, nome: 'Due settimane', nota: 'Il ritmo si sente' },
  { giorni: 21, nome: 'Tre settimane', nota: 'Un classico primo traguardo' },
  { giorni: 30, nome: 'Un mese', nota: 'Un bel risultato' },
  { giorni: 66, nome: '66 giorni', nota: 'In media un’abitudine diventa automatica' }
];

// Da chiamare dopo ogni cambiamento: se l'obiettivo è raggiunto lo sposta tra i traguardi,
// sceglie il premio (quello scritto oppure la prossima pillola di saggezza) e lo segna "da festeggiare".
export function controllaObiettivo() {
  const p = progressoObiettivo(data);
  if (!p || !p.raggiunto) return false;
  const o = data.obiettivo;
  data.traguardi.push({
    giorni: o.giorni, premio: o.premio, raggiunto: todayKey(),
    pillola: o.premio ? null : data.traguardi.filter(t => t.pillola !== null).length % PILLOLE.length,
    visto: false
  });
  data.obiettivo = null;
  save();
  return true;
}

// L'ultimo traguardo raggiunto e non ancora festeggiato, oppure null.
export function daFesteggiare() {
  const t = data.traguardi[data.traguardi.length - 1];
  return t && !t.visto ? t : null;
}
export function festeggiato() { const t = daFesteggiare(); if (t) { t.visto = true; save(); } }

// proposta per il prossimo obiettivo: un po' più lungo dell'ultimo raggiunto
export function prossimaProposta() {
  const ultimo = data.traguardi.length ? data.traguardi[data.traguardi.length - 1].giorni : 0;
  const p = PROPOSTE.find(x => x.giorni > ultimo);
  return p ? p.giorni : Math.min(365, ultimo * 2);
}

// ---------- pannello "Obiettivo di serie" ----------
let opener = null;

export function openGoal() {
  opener = document.activeElement;
  const o = data.obiettivo;
  ui.goal = o ? { giorni: o.giorni, premio: o.premio } : { giorni: prossimaProposta(), premio: '' };
  renderGoal();
  document.getElementById('g-title').focus();
}

export function renderGoal() {
  const g = ui.goal, proposta = PROPOSTE.some(p => p.giorni === g.giorni);
  const opzioni = PROPOSTE.map(p => `<label><input type="radio" name="g-giorni" value="${p.giorni}" ${g.giorni === p.giorni ? 'checked' : ''}>
      <span><b>${p.nome}</b><small>${p.nota}</small></span></label>`).join('');
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="g-title">
    <div class="row"><h1 class="grow" id="g-title" tabindex="-1">Obiettivo di serie</h1><button class="ibtn" data-act="goalClose" aria-label="Chiudi">${icon('x')}</button></div>
    <p class="muted" style="margin:8px 0 0">Quanti giorni di fila vuoi raggiungere? Si contano da oggi,
      con la stessa regola della serie (${data.settings.soglia === 0.8 ? 'circa l’80%' : 'tutte'} le abitudini previste).</p>
    <fieldset class="seg"><legend>Traguardo</legend>${opzioni}
      <label><input type="radio" name="g-giorni" value="altro" ${proposta ? '' : 'checked'}><span><b>Scegli tu</b><small>Da 2 a 365 giorni</small></span></label>
    </fieldset>
    ${proposta ? '' : `<label for="g-altro">Numero di giorni</label><input type="number" id="g-altro" inputmode="numeric" min="2" max="365" value="${g.giorni}">`}
    <label for="g-premio">Il tuo premio (facoltativo)</label>
    <input type="text" id="g-premio" maxlength="60" value="${esc(g.premio)}" placeholder="es. una cena fuori, un libro nuovo" autocomplete="off">
    <p class="muted small" style="margin:6px 0 0">${icon('lightbulb', 16).replace('class="ico"', 'class="ico inline"')} Se lo lasci vuoto, al traguardo riceverai una pillola di saggezza.
      Un premio scelto da te però motiva di più: meglio qualcosa che ti fa bene.</p>
    <button class="btn block" data-act="goalSave" style="margin-top:20px">${data.obiettivo ? 'Salva' : 'Inizia'}</button>
    ${data.obiettivo ? '<button class="btn danger block" data-act="goalRemove">Togli l’obiettivo</button>' : ''}
  </div></div>`;
}

// copia i campi del pannello in ui.goal
export function syncGoal() {
  const sel = document.querySelector('input[name="g-giorni"]:checked'), altro = document.getElementById('g-altro');
  if (sel && sel.value !== 'altro') ui.goal.giorni = Number(sel.value);
  else if (altro) ui.goal.giorni = parseInt(altro.value, 10) || 0;
  const premio = document.getElementById('g-premio');
  if (premio) ui.goal.premio = premio.value;
}

// salva; restituisce un messaggio di errore oppure null
export function saveGoal() {
  syncGoal();
  const { giorni, premio } = ui.goal;
  if (!Number.isInteger(giorni) || giorni < 2 || giorni > 365) return 'Scegli un numero di giorni da 2 a 365.';
  const stesso = data.obiettivo && data.obiettivo.giorni === giorni;
  // cambiando il numero di giorni il conteggio riparte da oggi; cambiando solo il premio no
  data.obiettivo = { giorni, premio: premio.trim().slice(0, 60), creato: stesso ? data.obiettivo.creato : todayKey() };
  save();
  return null;
}

export function removeGoal() { data.obiettivo = null; save(); }

export function closeGoal() {
  ui.goal = null;
  document.getElementById('modal').innerHTML = '';
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}
