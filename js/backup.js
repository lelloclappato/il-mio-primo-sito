// Esportazione e importazione dei dati in un file JSON.
import { todayKey } from './utili.js';
import { data, save, setData } from './dati.js';
import { render } from './viste.js';

// crea un file al volo e lo fa scaricare
export function exportBackup() {
  data.lastBackup = todayKey(); save();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'abitudini-backup-' + todayKey() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  render();
}

// apre la scelta del file (l'<input type="file"> nascosto in index.html)
export function askImport() { document.getElementById('importFile').click(); }

// quando è stato scelto un file, lo legge e, se è valido, sostituisce i dati
export function setupImport() {
  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.habits) || typeof d.logs !== 'object') throw new Error();
        if (!confirm('Importare il backup? Sostituisce tutti i dati attuali.')) return;
        setData(d); render();
      } catch (err) { alert('File non valido: non sembra un backup di Abitudini.'); }
    };
    r.readAsText(file);
  });
}
