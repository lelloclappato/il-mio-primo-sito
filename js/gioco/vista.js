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
import { simula, CATEGORIE } from './motore.js';
import { svgPianta } from './pianta.js';
import { lanciaCoriandoli } from './coriandoli.js';
import { SPECIE, specieDa } from './specie.js';

// specie scelta (null se non ancora scelta) e nomi degli stadi: quelli della specie, altrimenti quelli generici
const specieScelta = () => specieDa(data.gioco.specie);
const nomeStadio = i => specieScelta() ? specieScelta().stadi[i][0] : CONFIG.stadi[i].nome;
const articolo = i => specieScelta() ? specieScelta().stadi[i][1] : CONFIG.stadi[i].articolo;
const disegno = (r, size, label = '') => svgPianta(r.stadio, r.aspetto, { size, label, specie: data.gioco.specie });

export const nomePianta = () => data.gioco.nome || 'Pianta';
const dataBreve = k => { const d = dateOf(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const ASPETTO = { ok: 'in forma', stanca: 'un po’ stanca', appassita: 'appassita' };

// frase sulla pianta: incoraggia sempre, non rimprovera mai
function fraseSalute(r) {
  if (r.aspetto === 'appassita') return 'Sta riposando. Non preoccuparti: basta ricominciare e si riprende.';
  if (r.aspetto === 'stanca') return 'Ha un po’ di sete: una giornata completa e torna in forma.';
  if (r.prossimo && r.progressoStadio > 0.85) return `Manca pochissimo: sta per diventare ${articolo(r.stadio + 1)}!`;
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
  if (!data.gioco.specie) return cardScegli();
  const r = simula(data);
  const label = `${nomePianta()}: ${nomeStadio(r.stadio).toLowerCase()}, ${ASPETTO[r.aspetto]}`;
  return `<section class="card g-card" aria-label="La tua pianta">
    <button class="g-svg" data-act="tab" data-id="gioco" aria-label="${esc(label)}. Apri i traguardi">${disegno(r, 88)}</button>
    <div class="grow">
      <div class="g-nome">${esc(nomePianta())}</div>
      <div class="muted small">${esc(specieScelta().nome)} · ${nomeStadio(r.stadio)} (${r.stadio + 1} di ${CONFIG.stadi.length})</div>
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
  // le medaglie degli stadi prendono il nome dello stadio della pianta scelta
  r.medaglie.forEach(m => { const i = /^stadio-(\d)$/.exec(m.id); if (i) { m.nome = nomeStadio(+i[1]); m.desc = `La pianta diventa ${articolo(+i[1])}.`; } });
  const sblocc = r.medaglie.filter(m => m.data);
  const mese = MONTHS[new Date().getMonth()];

  let html = `<h1>Traguardi</h1>
  <section class="card g-big" aria-label="La tua pianta">
    ${disegno(r, 170, `${nomePianta()}: ${nomeStadio(r.stadio).toLowerCase()}, ${ASPETTO[r.aspetto]}`)}
    <div class="g-nome big">${esc(nomePianta())}
      <button class="ibtn" data-act="nomeApri" aria-label="Cambia il nome della pianta">${icon('pencil', 18)}</button></div>
    <div class="muted">${specieScelta() ? esc(specieScelta().nome) + ' · ' : ''}${nomeStadio(r.stadio)} · ${ASPETTO[r.aspetto]}</div>
    <button class="linkbtn" data-act="specieApri">${specieScelta() ? 'Cambia pianta' : 'Scegli la tua pianta'}</button>
    <p class="g-frase" style="text-align:center">${fraseSalute(r)}</p>
    ${barra('Crescita', r.progressoStadio, testoCrescita(r), 'full')}
    ${r.prossimo ? `<p class="muted small" style="margin:4px 0 0">Prossimo stadio: <strong>${nomeStadio(r.stadio + 1)}</strong>, tra ${r.prossimo.punti - r.punti} punti.</p>` : ''}
    ${barra('Salute', r.salute / 100, r.salute + '%', 'salute-' + r.aspetto)}
    <div class="g-stadi" aria-label="Stadi della pianta">${CONFIG.stadi.map((s, i) =>
      `<span class="${i <= r.stadio ? 'on' : ''}">${nomeStadio(i)}</span>`).join('')}</div>
  </section>
  ${cardCuriosita(r)}

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
  // medaglie per categoria: in ogni gruppo prima quelle ottenute (le più recenti in cima), poi le altre
  html += `<h2>Medaglie · ${sblocc.length} di ${r.medaglie.length}</h2>`;
  for (const [cat, titolo] of CATEGORIE) {
    const gruppo = r.medaglie.filter(m => m.cat === cat);
    const prese = gruppo.filter(m => m.data).sort((a, b) => b.data.localeCompare(a.data)), altre = gruppo.filter(m => !m.data);
    html += `<h3 class="g-cat">${titolo} <span class="muted">${prese.length}/${gruppo.length}</span></h3>
      <div class="g-medaglie">${prese.map(m => `<div class="g-med on cat-${cat}">${icon('award', 28)}<b>${esc(m.nome)}</b><span>${esc(m.desc)}</span><span class="g-data">${dataBreve(m.data)}</span></div>`).join('')}
      ${altre.map(m => `<div class="g-med">${icon('lock', 22)}<b>${esc(m.nome)}</b><span>${esc(m.desc)}</span></div>`).join('')}</div>`;
  }

  html += `<h2>Festeggiamenti</h2><div class="card">
    <label class="switch-row"><input type="checkbox" id="g-coriandoli" ${data.gioco.coriandoli ? 'checked' : ''}><span>Coriandoli per medaglie e traguardi</span></label>
    <p class="muted small" style="margin:4px 0 0">Non compaiono comunque se il telefono è impostato per ridurre le animazioni.</p></div>
  <p class="muted small" style="text-align:center">Come si guadagnano i punti: ogni abitudine ${CONFIG.punti[1]}, ${CONFIG.punti[2]} o ${CONFIG.punti[3]} punti
    (facile, media, difficile), +${CONFIG.bonusSerieSalva} se la serie è salva, +${CONFIG.bonusGiornataPerfetta} se la giornata è perfetta,
    e fino a +${Math.round(CONFIG.moltiplicatore.tetto * 100)}% con una serie lunga.</p>`;
  return html;
}

// ---------- scelta della pianta ----------
// In "Oggi", finché non è scelta: invito con le anteprime delle piante
function cardScegli() {
  return `<section class="card g-scegli" aria-labelledby="g-scegli-t">
    <h2 id="g-scegli-t" style="margin:0">Scegli la tua pianta</h2>
    <p class="muted small" style="margin:4px 0 8px">Crescerà con le tue abitudini. Ognuna ha il suo aspetto e le sue curiosità da scoprire.</p>
    <div class="g-anteprime" aria-hidden="true">${SPECIE.map(s => svgPianta(4, 'ok', { size: 44, specie: s.id })).join('')}</div>
    <button class="btn block" data-act="specieApri">Scegli</button>
  </section>`;
}

// Curiosità della pianta: la prima subito, le altre una per ogni nuovo stadio
function cardCuriosita(r) {
  const s = specieScelta();
  if (!s) return '';
  return `<h2>Curiosità: ${esc(s.nome)} <span class="muted" style="text-transform:none;letter-spacing:0">(${esc(s.latino)})</span></h2>
    <div class="card"><ol class="g-curiosita">${s.curiosita.map((c, i) => i <= r.stadio
      ? `<li>${esc(c)}</li>`
      : `<li class="chiusa">${icon('lock', 16).replace('class="ico"', 'class="ico inline"')} Si scopre quando la pianta diventa ${articolo(i)}.</li>`).join('')}</ol></div>`;
}

let openerSpecie = null;
export function openSpecie() {
  openerSpecie = document.activeElement;
  ui.specie = true;
  const attuale = data.gioco.specie || SPECIE[0].id;
  document.getElementById('modal').innerHTML = `<div class="modal" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="s-title">
    <div class="row"><h1 class="grow" id="s-title" tabindex="-1">Scegli la tua pianta</h1><button class="ibtn" data-act="specieChiudi" aria-label="Chiudi">${icon('x')}</button></div>
    <p class="muted" style="margin:8px 0 0">Crescono tutte allo stesso ritmo: cambiano l’aspetto e le curiosità.
      ${data.gioco.specie ? 'Se cambi pianta, la crescita raggiunta resta la stessa.' : ''}</p>
    <fieldset class="g-specie"><legend class="sr-only">Pianta</legend>${SPECIE.map(s => `<label>
      <input type="radio" name="specie" value="${s.id}" ${s.id === attuale ? 'checked' : ''}>
      <span>${svgPianta(4, 'ok', { size: 64, specie: s.id })}<b>${esc(s.nome)}</b><small>${esc(s.breve)}</small></span></label>`).join('')}
    </fieldset>
    <button class="btn block" data-act="specieSalva" style="margin-top:16px">Scegli questa pianta</button>
  </div></div>`;
  document.getElementById('s-title').focus();
}
export function saveSpecie() {
  const sel = document.querySelector('input[name="specie"]:checked');
  if (sel && specieDa(sel.value)) { data.gioco.specie = sel.value; save(); }
}
export function closeSpecie() {
  ui.specie = false;
  document.getElementById('modal').innerHTML = '';
  if (openerSpecie && document.contains(openerSpecie)) openerSpecie.focus();
  openerSpecie = null;
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
      ? `Ecco la tua pianta: grazie alle abitudini che hai già fatto è già ${articolo(r.stadio)}!`
      : 'Ecco la tua pianta! Cresce con ogni abitudine che completi.' }];
  }
  if (r.stadio > g.stadioVisto) {
    ev.push({ tipo: 'stadio', testo: `Nuovo stadio per ${nomePianta()}: ${nomeStadio(r.stadio)}!${specieScelta() ? ' C’è una nuova curiosità da leggere.' : ''}` });
    g.stadioVisto = r.stadio;
  }
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
