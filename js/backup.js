// Esportazione e importazione dei dati in un file JSON.
import { todayKey, dateOf, MONTHS } from './utili.js';
import { data, save, setData, STORE } from './dati.js';
import { controllaBackup } from './validazione.js';
import { render, annuncia } from './viste.js';

// Prima di ogni importazione i dati attuali vengono copiati qui, per poter tornare indietro.
export const PRIMA_IMPORT = STORE + '-prima-importazione';

// crea un file al volo e lo fa scaricare
export function exportBackup() {
  data.lastBackup = todayKey(); save();
  // "app" ed "esportatoIl" aiutano a riconoscere il file; all'importazione vengono ignorati
  const file = { app: 'le-mie-abitudini', esportatoIl: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'abitudini-backup-' + todayKey() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  render();
  annuncia('Backup esportato');
}

// apre la scelta del file (l'<input type="file"> nascosto in index.html)
export function askImport() { document.getElementById('importFile').click(); }

const dataBreve = k => { const d = dateOf(k); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

// Legge il file scelto, lo controlla e, se va bene e l'utente conferma, sostituisce i dati.
export function setupImport() {
  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0]; e.target.value = ''; // così si può scegliere di nuovo lo stesso file
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Il file è troppo grande (più di 5 MB): non sembra un backup di Abitudini.'); return; }
    const r = new FileReader();
    r.onload = () => {
      let json;
      try { json = JSON.parse(r.result); } catch (err) { alert('Il file non è in formato JSON: non sembra un backup di Abitudini.'); return; }
      const c = controllaBackup(json);
      if (!c.ok) {
        alert('Non posso importare questo file:\n\n• ' + c.errori.slice(0, 5).join('\n• ') + (c.errori.length > 5 ? `\n…e altri ${c.errori.length - 5} problemi.` : ''));
        return;
      }
      const { abitudini, giorni, dal, al } = c.riepilogo;
      let msg = `Il backup contiene ${abitudini} ${abitudini === 1 ? 'abitudine' : 'abitudini'} e ${giorni} ${giorni === 1 ? 'giorno segnato' : 'giorni segnati'}`
        + (!dal ? '' : dal === al ? ` (il ${dataBreve(dal)})` : ` (dal ${dataBreve(dal)} al ${dataBreve(al)})`) + '.';
      if (c.avvisi.length) msg += '\n\nNote:\n• ' + c.avvisi.join('\n• ');
      msg += '\n\nImportarlo sostituisce i dati attuali. Prima ne salvo una copia nel browser, così potrai annullare.';
      if (!confirm(msg)) return;
      try { localStorage.setItem(PRIMA_IMPORT, JSON.stringify(data)); }
      catch (err) { alert('Non riesco a salvare la copia dei dati attuali (memoria piena): importazione annullata.'); return; }
      setData(c.dati); render();
      annuncia('Backup importato');
    };
    r.onerror = () => alert('Non riesco a leggere il file.');
    r.readAsText(file);
  });
}

// C'è una copia dei dati di prima dell'ultima importazione?
export function hasPrimaImport() { try { return localStorage.getItem(PRIMA_IMPORT) !== null; } catch (e) { return false; } }

// Torna ai dati di prima dell'ultima importazione.
export function annullaImport() {
  const c = controllaBackup(JSON.parse(localStorage.getItem(PRIMA_IMPORT) || 'null'));
  if (!c.ok) { alert('La copia dei dati precedenti non è leggibile.'); return; }
  if (!confirm('Tornare ai dati che avevi prima dell’ultima importazione? I dati attuali verranno sostituiti.')) return;
  setData(c.dati);
  localStorage.removeItem(PRIMA_IMPORT);
  render();
  annuncia('Dati precedenti ripristinati');
}
