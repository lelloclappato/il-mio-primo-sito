// Stato dell'interfaccia: cosa si sta guardando in questo momento.
// Non viene salvato: riaprendo l'app si riparte da "Oggi".
// È un oggetto così gli altri file possono modificarne le proprietà (ui.tab = 'stat').
import { todayKey } from './utili.js';

export const ui = {
  tab: 'oggi',          // 'oggi' | 'stat' | 'hab'
  viewKey: todayKey(),  // giorno mostrato in "Oggi"
  form: null,           // copia dell'abitudine in modifica, oppure null se il modulo è chiuso
  goal: null            // bozza dell'obiettivo di serie mentre il suo pannello è aperto
};
