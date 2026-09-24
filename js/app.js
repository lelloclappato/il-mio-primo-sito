// Punto di partenza dell'app: collega i tocchi dell'utente alle azioni e disegna la prima schermata.
//
// Invece di mettere un "ascoltatore" su ogni pulsante, ce n'è uno solo su tutto il documento
// ("delega degli eventi"): quando tocchi qualcosa, cerca l'elemento più vicino con data-act
// e in base al suo valore decide cosa fare. Così funziona anche con l'HTML ridisegnato da render().
import { todayKey, keyOf, dateOf, addDays, fmt, uid } from './utili.js';
import { data, save, getVal, setVal, getJournal, setJournal, clearMigrationNote } from './dati.js';
import { isDone } from './calcoli.js';
import { ui } from './stato.js';
import { render, annuncia, UMORI } from './viste.js';
import { openForm, renderForm, syncForm, closeForm } from './modulo.js';
import { exportBackup, askImport, setupImport, annullaImport } from './backup.js';

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  const h = id ? data.habits.find(x => x.id === id) : null;
  if (el.tagName === 'A') e.preventDefault();
  // tocco sullo sfondo scuro del pannello (non sul pannello stesso): chiudi
  if (act === 'closeBg') { if (e.target === el) closeForm(); return; }
  switch (act) {
    // --- navigazione ---
    case 'tab': ui.tab = id; render(); window.scrollTo(0, 0); break;
    case 'day': {
      const nd = addDays(dateOf(ui.viewKey), Number(el.dataset.n));
      if (keyOf(nd) <= todayKey()) { ui.viewKey = keyOf(nd); render(); }
      break;
    }
    case 'goToday': ui.viewKey = todayKey(); render(); break;
    case 'dismissNote': clearMigrationNote(); render(); break;
    // --- diario ---
    case 'mood': { // toccare l'umore già scelto lo toglie
      const v = Number(el.dataset.v), nuovo = getJournal(ui.viewKey).mood === v ? null : v;
      setJournal(ui.viewKey, 'mood', nuovo); render();
      annuncia(nuovo ? `Umore: ${UMORI[v - 1]}` : 'Umore tolto');
      break;
    }
    // --- segnare le abitudini ---
    case 'toggle': // se è fatta la si toglie, altrimenti la si segna
      setVal(id, ui.viewKey, isDone(data, h, ui.viewKey) ? 0 : 1); render();
      annuncia(`${h.name}: ${isDone(data, h, ui.viewKey) ? 'fatta' : 'da fare'}`);
      break;
    case 'inc': case 'dec':
      setVal(id, ui.viewKey, getVal(id, ui.viewKey) + (act === 'inc' ? h.step : -h.step)); render();
      annuncia(`${h.name}: ${fmt(getVal(id, ui.viewKey))} di ${fmt(h.target)} ${h.unit}`);
      break;
    case 'edit-val': {
      const r = prompt(`${h.name}: quanto hai fatto? (${h.unit})`, fmt(getVal(id, ui.viewKey)));
      if (r !== null) { const n = parseFloat(r.replace(',', '.')); if (!isNaN(n) && n >= 0) { setVal(id, ui.viewKey, n); render(); annuncia(`${h.name}: ${fmt(n)} di ${fmt(h.target)} ${h.unit}`); } }
      break;
    }
    // --- pannello crea/modifica ---
    case 'new': openForm(null); break;
    case 'newFromEmpty': ui.tab = 'hab'; render(); openForm(null); break;
    case 'edit': openForm(h); break;
    case 'closeForm': closeForm(); break;
    case 'fday': {
      syncForm(); const d = Number(el.dataset.d);
      ui.form.days = ui.form.days.includes(d) ? ui.form.days.filter(x => x !== d) : ui.form.days.concat(d);
      renderForm(); break;
    }
    case 'fall': syncForm(); ui.form.days = [0, 1, 2, 3, 4, 5, 6]; renderForm(); break;
    case 'fwork': syncForm(); ui.form.days = [1, 2, 3, 4, 5]; renderForm(); break;
    case 'saveForm': {
      syncForm();
      const f = ui.form;
      if (!f.name.trim()) { alert('Scrivi un nome.'); break; }
      if (!f.days.length) { alert('Scegli almeno un giorno.'); break; }
      if (f.type === 'qty') {
        if (!(f.target > 0)) { alert('L’obiettivo deve essere maggiore di zero.'); break; }
        if (!(f.step > 0)) f.step = 1;
      } else { f.target = 1; f.step = 1; f.unit = ''; }
      f.name = f.name.trim();
      if (f.id) { const i = data.habits.findIndex(x => x.id === f.id); data.habits[i] = f; }
      else { f.id = uid(); data.habits.push(f); }
      save(); closeForm(); render(); annuncia(`Abitudine “${f.name}” salvata`); break;
    }
    case 'delete':
      if (confirm(`Eliminare “${ui.form.name}” e tutto il suo storico?`)) {
        const hid = ui.form.id;
        data.habits = data.habits.filter(x => x.id !== hid);
        for (const k of Object.keys(data.logs)) { delete data.logs[k][hid]; if (!Object.keys(data.logs[k]).length) delete data.logs[k]; }
        save(); closeForm(); render();
      }
      break;
    // --- backup ---
    case 'export': exportBackup(); break;
    case 'import': askImport(); break;
    case 'undoImport': annullaImport(); break;
  }
});

// cambiando il tipo (Sì/No ↔ Quantità) cambiano i campi mostrati nel pannello
document.addEventListener('change', e => {
  if (e.target.name === 'f-type' && ui.form) {
    syncForm(); ui.form.type = e.target.value;
    if (ui.form.type === 'qty' && !(ui.form.target > 1)) { ui.form.target = ui.form.target || 1; }
    renderForm();
    document.querySelector(`input[name="f-type"][value="${ui.form.type}"]`).focus();
  }
});

// ---------- nota del giorno ----------
// Si salva mezzo secondo dopo che smetti di scrivere ("debounce": non a ogni lettera),
// e subito quando esci dal campo o dall'app, così non si perde niente.
let timerNota = null, giornoNota = null;
function salvaNota() {
  clearTimeout(timerNota); timerNota = null;
  const el = document.getElementById('nota-giorno');
  if (!el || giornoNota === null) return;
  setJournal(giornoNota, 'note', el.value.trim() ? el.value : '');
  giornoNota = null;
}
document.addEventListener('input', e => {
  if (e.target.id !== 'nota-giorno') return;
  giornoNota = ui.viewKey; // il giorno a cui appartiene la nota, anche se poi si cambia pagina
  clearTimeout(timerNota); timerNota = setTimeout(salvaNota, 500);
});
document.addEventListener('focusout', e => { if (e.target.id === 'nota-giorno') salvaNota(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') salvaNota(); });

// tasto Esc: chiude il pannello
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.form) closeForm();
});

// quando si torna all'app (es. il giorno dopo), ridisegna per aggiornare le date
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !ui.form && ui.viewKey > todayKey()) { ui.viewKey = todayKey(); }
  if (document.visibilityState === 'visible' && !ui.form) render();
});

setupImport();
render();
// il service worker (sw.js) permette di usare l'app senza connessione
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
