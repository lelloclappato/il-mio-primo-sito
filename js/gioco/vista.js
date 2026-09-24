// Tutto ciò che si vede del gioco della pianta:
// - la scheda in alto in "Oggi"
// - la schermata "Traguardi" (pianta grande, salvagente, obiettivi raggiunti, medaglie)
// - il pannello per dare un nome alla pianta
// - i festeggiamenti (avviso + coriandoli) per nuove medaglie e nuovi stadi
import { dateOf, esc, MONTHS, keyOf, addDays } from '../utili.js';
import { data, save } from '../dati.js';
import { ui } from '../stato.js';
import { icon } from '../icone.js';
import { PILLOLE } from '../frasi.js';
import { CONFIG } from './config.js';
import { simula } from './motore.js';
import { svgPianta } from './pianta.js';
import { lanciaCoriandoli } from './coriandoli.js';

export const nomePianta = () => data.gioco.nome || 'Pianta';
const dataBreve = k => { const d = dateOf(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const ASPETTO = { ok: 'in forma', stanca: 'un po’ stanca', appassita: 'appassita' };

// frase sulla pianta: incoraggia sempre, non rimprovera mai
function fraseSalute(r) {
  if (r.aspetto === 'appassita') return 'Sta riposando. Non preoccuparti: basta ricominciare e si riprende.';
  if (r.aspetto === 'stanca') return 'Ha un po’ di sete: una giornata completa e torna in forma.';
  if (r.prossimo && r.progressoStadio > 0.85) return `Manca pochissimo: sta per diventare ${r.prossimo.articolo}!`;
  return r.stadio === 0 ? 'Ogni abitudine che completi la aiuta a spuntare.' : 'Cresce bene: continua così.';
}

// barra con etichetta (crescita o salute)
function barra(etichetta, valore, testo, cls) {
  return `<div class="g-bar"><div class="g-bar-l"><span>${etichetta}</span><span class="num">${testo}</span></div>
    <div class="bar ${cls}" role="img" aria-label="${etichetta}: ${testo}"><i style="width:${Math.round(valore * 100)}%"></i></div></div>`;
}
const testoCrescita = r => r.prossimo ? `${r.punti} / ${r.prossimo.punti} punti` : `${r.punti} punti · stadio massimo`;

// ---------- scheda in alto in "Oggi" ----------
export function cardPianta() {
  const r = simula(data);
  const label = `${nomePianta()}: ${r.nomeStadio.toLowerCase()}, ${ASPETTO[r.aspetto]}`;
  return `<section class="card g-card" aria-label="La tua pianta">
    <button class="g-svg" data-act="tab" data-id="gioco" aria-label="${esc(label)}. Apri i traguardi">${svgPianta(r.stadio, r.aspetto, { size: 88, label: '' })}</button>
    <div class="grow">
      <div class="g-nome">${esc(nomePianta())}</div>
      <div class="muted small">Stadio: ${r.nomeStadio} (${r.stadio + 1} di ${CONFIG.stadi.length})</div>
      ${barra('Crescita', r.progressoStadio, testoCrescita(r), 'full')}
      ${barra('Salute', r.salute / 100, r.salute + '%', 'salute-' + r.aspetto)}
      <p class="g-frase">${r.puntiOggi ? `<strong class="num">+${r.puntiOggi}</strong> punti oggi · ` : ''}${fraseSalute(r)}</p>
      ${!data.gioco.nome && !data.gioco.nomeChiesto ? `<button class="linkbtn" data-act="nomeApri" style="margin-left:-8px">${icon('pencil', 16)}Dai un nome alla tua pianta</button>` : ''}
    </div>
  </section>`;
}

// riga sul salvagente nel riquadro della serie, se è scattato negli ultimi 3 giorni
export function rigaSalvagente() {
  const r = simula(data), limite = keyOf(addDays(new Date(), -3));
  const recente = r.salvagenti.filter(k => k >= limite).pop();
  if (!recente) return '';
  const quando = recente === keyOf(addDays(new Date(), -1)) ? 'ieri' : `il ${dataBreve(recente)}`;
  return `<p class="g-salv">${icon('lifebuoy', 18)}<span>Il salvagente ha protetto la tua serie ${quando}. ${
    r.salvagente.disponibili ? '' : `Il prossimo arriva il 1° ${MONTHS[(new Date().getMonth() + 1) % 12]}.`}</span></p>`;
}

// avviso su un giorno passato protetto dal salvagente (quando lo si guarda in "Oggi")
export function avvisoGiornoSalvato(k) {
  return simula(data).salvagenti.includes(k)
    ? `<p class="g-salv">${icon('lifebuoy', 18)}<span>Questo giorno è stato protetto dal salvagente: la serie non si è interrotta.</span></p>` : '';
}

// ---------- schermata "Traguardi" ----------
export function viewTraguardi() {
  const r = simula(data);
  const sblocc = r.medaglie.filter(m => m.data).sort((a, b) => b.data.localeCompare(a.data));
  const bloccate = r.medaglie.filter(m => !m.data);
  const mese = MONTHS[new Date().getMonth()];

  let html = `<h1>Traguardi</h1>
  <section class="card g-big" aria-label="La tua pianta">
    ${svgPianta(r.stadio, r.aspetto, { size: 170, label: `${nomePianta()}: ${r.nomeStadio.toLowerCase()}, ${ASPETTO[r.aspetto]}` })}
    <div class="g-nome big">${esc(nomePianta())}
      <button class="ibtn" data-act="nomeApri" aria-label="Cambia il nome della pianta">${icon('pencil', 18)}</button></div>
    <div class="muted">${r.nomeStadio} · ${ASPETTO[r.aspetto]}</div>
    <p class="g-frase" style="text-align:center">${fraseSalute(r)}</p>
    ${barra('Crescita', r.progressoStadio, testoCrescita(r), 'full')}
    ${r.prossimo ? `<p class="muted small" style="margin:4px 0 0">Prossimo stadio: <strong>${r.prossimo.nome}</strong>, tra ${r.prossimo.punti - r.punti} punti.</p>` : ''}
    ${barra('Salute', r.salute / 100, r.salute + '%', 'salute-' + r.aspetto)}
    <div class="g-stadi" aria-label="Stadi della pianta">${CONFIG.stadi.map((s, i) =>
      `<span class="${i <= r.stadio ? 'on' : ''}">${s.nome}</span>`).join('')}</div>
  </section>

  <section class="card"><div class="row">${icon('lifebuoy', 24)}<div class="grow"><b>Salvagente di ${mese}</b>
    <div class="muted small">${r.salvagente.disponibili
      ? `Disponibile. Se salti un giorno mentre hai una serie in corso, la protegge da solo (${CONFIG.salvagentiAlMese} al mese).`
      : `Usato il ${dataBreve(r.salvagente.usatiMese[r.salvagente.usatiMese.length - 1])}. Il prossimo arriva il 1° ${MONTHS[(new Date().getMonth() + 1) % 12]}.`}</div></div></div>
  </section>`;

  // obiettivi di serie raggiunti
  if (data.traguardi.length) {
    html += `<h2>Obiettivi raggiunti</h2><div class="card"><ul class="g-lista">${data.traguardi.slice().reverse().map(t => {
      const pill = t.pillola !== null ? PILLOLE[t.pillola % PILLOLE.length] : null;
      return `<li>${icon('trophy', 20)}<div><b>${t.giorni} giorni di fila</b> <span class="muted small">· ${dataBreve(t.raggiunto)}</span>
        <div class="small">${pill ? `Pillola: ${esc(pill.testo)}` : `Premio: ${esc(t.premio)}`}</div></div></li>`;
    }).join('')}</ul></div>`;
  }

  // medaglie
  html += `<h2>Medaglie · ${sblocc.length} di ${r.medaglie.length}</h2>
    <div class="g-medaglie">${sblocc.map(m => `<div class="g-med on">${icon('award', 28)}<b>${esc(m.nome)}</b><span>${dataBreve(m.data)}</span></div>`).join('')}
    ${bloccate.map(m => `<div class="g-med">${icon('lock', 22)}<b>${esc(m.nome)}</b><span>${esc(m.desc)}</span></div>`).join('')}</div>`;

  html += `<h2>Festeggiamenti</h2><div class="card">
    <label class="switch-row"><input type="checkbox" id="g-coriandoli" ${data.gioco.coriandoli ? 'checked' : ''}><span>Coriandoli per medaglie e traguardi</span></label>
    <p class="muted small" style="margin:4px 0 0">Non compaiono comunque se il telefono è impostato per ridurre le animazioni.</p></div>
  <p class="muted small" style="text-align:center">Come si guadagnano i punti: ogni abitudine ${CONFIG.punti[1]}, ${CONFIG.punti[2]} o ${CONFIG.punti[3]} punti
    (facile, media, difficile), +${CONFIG.bonusSerieSalva} se la serie è salva, +${CONFIG.bonusGiornataPerfetta} se la giornata è perfetta,
    e fino a +${Math.round(CONFIG.moltiplicatore.tetto * 100)}% con una serie lunga.</p>`;
  return html;
}

// ---------- pannello "Nome della pianta" ----------
let opener = null;
export function openNome() {
  opener = document.activeElement;
  ui.nome = true;
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="n-title">
    <div class="row"><h1 class="grow" id="n-title">Dai un nome alla pianta</h1><button class="ibtn" data-act="nomeChiudi" aria-label="Chiudi">${icon('x')}</button></div>
    <p class="muted" style="margin:8px 0 0">Crescerà insieme alle tue abitudini. Se non scrivi niente, si chiamerà semplicemente “Pianta”.</p>
    <label for="n-nome">Nome</label>
    <input type="text" id="n-nome" maxlength="20" value="${esc(data.gioco.nome)}" placeholder="es. Basilico, Gino, Speranza" autocomplete="off">
    <button class="btn block" data-act="nomeSalva" style="margin-top:20px">Salva</button>
  </div></div>`;
  document.getElementById('n-nome').focus();
}
export function saveNome() {
  data.gioco.nome = document.getElementById('n-nome').value.trim().slice(0, 20);
  data.gioco.nomeChiesto = true; // non chiederlo più in "Oggi" (si può cambiare da "Traguardi")
  save();
}
export function closeNome() {
  ui.nome = false;
  document.getElementById('modal').innerHTML = '';
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}

// ---------- festeggiamenti ----------
// Confronta lo stato del gioco con quello già festeggiato e restituisce le novità
// (nuove medaglie, nuovo stadio), segnandole come viste.
export function nuoviEventi() {
  const r = simula(data), g = data.gioco, ev = [];
  const sbloccate = r.medaglie.filter(m => m.data);
  if (!g.iniziato) {
    // prima volta: la storia passata non si festeggia tutta insieme, si dà il benvenuto
    g.iniziato = true; g.stadioVisto = r.stadio; g.medaglieViste = sbloccate.map(m => m.id); save();
    return [{ tipo: 'benvenuto', testo: r.stadio > 0
      ? `Ecco la tua pianta: grazie alle abitudini che hai già fatto è già ${CONFIG.stadi[r.stadio].articolo}!`
      : 'Ecco la tua pianta! Cresce con ogni abitudine che completi.' }];
  }
  if (r.stadio > g.stadioVisto) { ev.push({ tipo: 'stadio', testo: `Nuovo stadio per ${nomePianta()}: ${r.nomeStadio}!` }); g.stadioVisto = r.stadio; }
  for (const m of sbloccate) {
    if (g.medaglieViste.includes(m.id) || m.id.startsWith('stadio-')) { if (!g.medaglieViste.includes(m.id)) g.medaglieViste.push(m.id); continue; }
    g.medaglieViste.push(m.id);
    ev.push({ tipo: 'medaglia', testo: `Nuova medaglia: ${m.nome}` });
  }
  if (ev.length) save();
  return ev;
}

// mostra un avviso in basso (sopra la barra) e, se c'è da festeggiare, i coriandoli
export function mostraEventi(ev, festa = false) {
  if (!ev.length && !festa) return;
  if (festa || ev.some(e => e.tipo !== 'benvenuto')) lanciaCoriandoli(data.gioco.coriandoli);
  if (!ev.length) return;
  const box = document.getElementById('evento');
  const testo = ev[0].testo + (ev.length > 1 ? ` (e ${ev.length - 1} ${ev.length === 2 ? 'altra novità' : 'altre novità'})` : '');
  box.innerHTML = `<div class="toast evento">${icon(ev[0].tipo === 'medaglia' ? 'award' : 'sprout', 22)}<span>${esc(testo)}</span>
    <button class="linkbtn" data-act="eventoVedi">Vedi</button><button class="ibtn" data-act="eventoChiudi" aria-label="Chiudi avviso">${icon('x', 18)}</button></div>`;
  clearTimeout(mostraEventi.t);
  mostraEventi.t = setTimeout(() => { box.innerHTML = ''; }, 7000);
}
