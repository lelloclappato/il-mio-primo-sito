// Punto di partenza dell'app: collega i tocchi dell'utente alle azioni e disegna la prima schermata.
//
// Invece di mettere un "ascoltatore" su ogni pulsante, ce n'è uno solo su tutto il documento
// ("delega degli eventi"): quando tocchi qualcosa, cerca l'elemento più vicino con data-act
// e in base al suo valore decide cosa fare. Così funziona anche con l'HTML ridisegnato da render().
import { todayKey, keyOf, dateOf, addDays, fmt, uid } from './utili.js';
import { data, save, getVal, setVal } from './dati.js';
import { ui } from './stato.js';
import { render } from './viste.js';
import { openForm, renderForm, syncForm, closeForm } from './modulo.js';
import { exportBackup, askImport, setupImport } from './backup.js';

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  const h = id ? data.habits.find(x => x.id === id) : null;
  if (['export', 'fall', 'fwork'].includes(act) || el.tagName === 'A') e.preventDefault();
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
    // --- segnare le abitudini ---
    case 'toggle': setVal(id, ui.viewKey, getVal(id, ui.viewKey) ? 0 : 1); render(); break;
    case 'inc': setVal(id, ui.viewKey, getVal(id, ui.viewKey) + h.step); render(); break;
    case 'dec': setVal(id, ui.viewKey, getVal(id, ui.viewKey) - h.step); render(); break;
    case 'edit-val': {
      const r = prompt(`${h.name}: quanto hai fatto? (${h.unit})`, fmt(getVal(id, ui.viewKey)));
      if (r !== null) { const n = parseFloat(r.replace(',', '.')); if (!isNaN(n) && n >= 0) { setVal(id, ui.viewKey, n); render(); } }
      break;
    }
    // --- pannello crea/modifica ---
    case 'new': openForm(null); break;
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
      save(); closeForm(); render(); break;
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
  }
});

// cambiando il tipo (Sì/No ↔ Quantità) cambiano i campi mostrati nel pannello
document.addEventListener('change', e => {
  if (e.target.id === 'f-type' && ui.form) {
    syncForm(); ui.form.type = e.target.value;
    if (ui.form.type === 'qty' && !(ui.form.target > 1)) { ui.form.target = ui.form.target || 1; }
    renderForm();
  }
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
