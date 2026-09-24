// "Rileggi il diario": tutti i giorni in cui hai scritto qualcosa o segnato l'umore, dal più recente.
import { dateOf, esc, DAYS_FULL, MONTHS } from './utili.js';
import { data } from './dati.js';
import { ui } from './stato.js';
import { icon } from './icone.js';
import { domandaDelGiorno } from './frasi.js';
import { UMORI } from './viste.js';

let opener = null;

export function openDiario() {
  opener = document.activeElement;
  ui.diario = true;
  const giorni = Object.keys(data.journal).sort().reverse();
  const voce = k => {
    const g = data.journal[k], d = dateOf(k), belle = (g.belle || []).filter(x => x && x.trim());
    return `<article class="d-voce">
      <h3>${DAYS_FULL[d.getDay()][0].toUpperCase() + DAYS_FULL[d.getDay()].slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}
        ${g.mood ? `<span class="d-umore">${icon('mood' + g.mood, 18)}${UMORI[g.mood - 1]}</span>` : ''}</h3>
      ${g.note ? `<p class="d-domanda">${esc(domandaDelGiorno(k))}</p><p class="d-nota">${esc(g.note)}</p>` : ''}
      ${belle.length ? `<ul class="d-belle">${belle.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    </article>`;
  };
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="d-title">
    <div class="row"><h1 class="grow" id="d-title" tabindex="-1">Il tuo diario</h1><button class="ibtn" data-act="diarioChiudi" aria-label="Chiudi">${icon('x')}</button></div>
    ${giorni.length
      ? `<p class="muted small" style="margin:6px 0 0">${giorni.length} ${giorni.length === 1 ? 'giorno' : 'giorni'} con qualcosa di scritto o l’umore segnato.</p>${giorni.map(voce).join('')}`
      : `<p class="muted" style="margin:10px 0 0">Il diario è ancora vuoto. In “Oggi”, nel riquadro del diario, puoi segnare l’umore e scrivere com’è andata: qui ritroverai tutto.</p>`}
  </div></div>`;
  document.getElementById('d-title').focus();
}

export function closeDiario() {
  ui.diario = false;
  document.getElementById('modal').innerHTML = '';
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}
