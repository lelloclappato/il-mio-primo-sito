// Disegno della pianta in SVG, costruito in codice.
// 5 stadi (0 → 4), 3 aspetti secondo la salute e 6 specie (vedi specie.js):
//   'ok'        colori pieni, un leggero ondeggiare
//   'stanca'    colori spenti (li cambia il CSS con le variabili --leaf, --bloom…)
//   'appassita' foglie piegate verso il basso, niente fiori né frutti, qualche foglia caduta a terra
// Il disegno sta in un riquadro 120×140; il vaso è in basso, la terra a y=100.
// Ogni pezzo ha una classe (p-leaf, p-trunk…) e il CSS gli dà il colore.

// forme di foglia che partono da (0,0) e puntano a destra, lunghe circa 20
const FOGLIE = {
  normale: 'M0 0C5-6 14-7 20 0C14 7 5 6 0 0Z',
  tonda: 'M0 0C3-8 14-10 19-2C15 7 4 7 0 0Z',       // basilico
  stretta: 'M0 0C6-2.5 16-3 22 0C16 3 6 2.5 0 0Z',   // olivo
  larga: 'M0 0C4-9 17-10 22 0C17 9 4 9 0 0Z'         // girasole
};
const FORMA = { basilico: 'tonda', olivo: 'stretta', girasole: 'larga' };

const f = (x, y, ang, s, d, cls = 'p-leaf') =>
  `<path class="${cls}" d="${d}" transform="translate(${x} ${y}) rotate(${ang}) scale(${s})"/>`;
const cerchi = (lista, cls) => lista.map(([x, y, r]) => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`).join('');
const rad = a => a * Math.PI / 180;
// petali disposti in cerchio intorno a (cx, cy)
const corona = (n, cx, cy, dist, rx, ry) => Array.from({ length: n }, (_, i) => i * 360 / n).map(a => {
  const x = (cx + dist * Math.cos(rad(a))).toFixed(1), y = (cy + dist * Math.sin(rad(a))).toFixed(1);
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a.toFixed(0)} ${x} ${y})"/>`;
}).join('');

export function svgPianta(stadio, aspetto = 'ok', { size = 120, label = '', specie = '' } = {}) {
  const giu = aspetto === 'appassita' ? 28 : aspetto === 'stanca' ? 10 : 0;
  const forma = FOGLIE[FORMA[specie] || 'normale'];
  const dx = (x, y, ang, s, cls) => f(x, y, ang + giu, s, forma, cls);   // foglia verso destra
  const sx = (x, y, ang, s, cls) => f(x, y, ang - giu, s, forma, cls);   // foglia verso sinistra
  const inForma = aspetto === 'ok', fiori = aspetto !== 'appassita';

  let pianta = '', sopra = '';   // "sopra" va disegnato davanti al vaso (semi appoggiati sulla terra)

  if (stadio === 0) {
    // ---------- il seme (ghianda per la quercia, nocciolo per l'olivo) ----------
    if (specie === 'quercia') sopra = `<ellipse class="p-acorn" cx="60" cy="95" rx="5.5" ry="7"/><path class="p-cap" d="M53.5 91a6.5 5 0 0 1 13 0z"/>`;
    else if (specie === 'olivo') sopra = `<ellipse class="p-seed" cx="60" cy="96" rx="4" ry="6.5" transform="rotate(20 60 96)"/>`;
    else sopra = `<ellipse class="p-seed" cx="60" cy="96" rx="7" ry="4.5"/>`;
    sopra += `<path class="p-stem" d="M62 91q2-5 6-6" stroke-width="2"/>`;
  } else if (specie === 'cactus') {
    // ---------- cactus: forme tutte sue ----------
    const spine = pts => pts.map(([x, y]) => `<circle class="p-spine" cx="${x}" cy="${y}" r="0.9"/>`).join('');
    if (stadio === 1) pianta = `<ellipse class="p-cactus" cx="60" cy="96" rx="8" ry="7"/>${spine([[56, 93], [64, 93], [60, 90]])}`;
    else {
      const alto = stadio === 2 ? 76 : stadio === 3 ? 56 : 48;
      pianta = `<rect class="p-cactus" x="51" y="${alto}" width="18" height="${104 - alto}" rx="9"/>
        <path class="p-cactus-rib" d="M60 ${alto + 4}V100M55.5 ${alto + 7}V100M64.5 ${alto + 7}V100"/>`;
      if (stadio >= 3) pianta += `<path class="p-cactus" d="M51 84h-9a4 4 0 0 1-4-4V70a4 4 0 0 1 8 0v6h5z"/>`;
      if (stadio >= 4) pianta += `<path class="p-cactus" d="M69 78h9a4 4 0 0 0 4-4V62a4 4 0 0 0-8 0v8h-5z"/>`;
      pianta += spine([[55, alto + 12], [65, alto + 16], [56, alto + 26], [64, alto + 32], [60, alto + 20], ...(stadio >= 3 ? [[42, 74]] : []), ...(stadio >= 4 ? [[78, 66]] : [])].filter(([, y]) => y < 100));
      if (stadio === 4 && fiori) pianta += `<g class="p-flower-pink">${corona(6, 60, alto - 3, 5, 4, 2.6)}</g><circle class="p-flower-c" cx="60" cy="${alto - 3}" r="2.5"/>`;
    }
  } else if (stadio === 1) {
    // ---------- germoglio (uguale per tutti, cambia la forma della foglia) ----------
    pianta = `<path class="p-stem" d="M60 100Q59 91 60 83" stroke-width="3"/>${dx(60, 84, -35, 0.65)}${sx(60, 84, 215, 0.65)}`;
  } else if (stadio === 2) {
    // ---------- piantina ----------
    pianta = `<path class="p-stem" d="M60 100Q56 82 60 64" stroke-width="3"/>
      ${dx(59, 90, -20, 0.8)}${sx(58, 81, 200, 0.85)}${dx(58, 73, -30, 0.8)}
      ${dx(60, 65, -45, 0.55, 'p-leaf2')}${sx(60, 65, 225, 0.55, 'p-leaf2')}`;
  } else if (specie === 'girasole') {
    // ---------- girasole: stelo alto, bocciolo, poi il grande fiore giallo ----------
    const cima = stadio === 3 ? 36 : 42;
    pianta = `<path class="p-stem" d="M60 100Q56 70 60 ${cima}" stroke-width="4"/>
      ${dx(58, 88, -10, 1.05)}${sx(57, 80, 190, 1.05, 'p-leaf2')}${dx(58, 68, -25, 0.95, 'p-leaf2')}${sx(58, 58, 205, 0.85)}`;
    if (stadio === 3) pianta += fiori ? `<circle class="p-bud" cx="60" cy="${cima - 5}" r="7"/>${f(54, cima - 2, 200, 0.4, FOGLIE.normale, 'p-leaf2')}${f(66, cima - 2, -20, 0.4, FOGLIE.normale, 'p-leaf2')}` : '';
    else if (fiori) {
      const c = cima - 12;
      pianta += `<g class="p-petal">${corona(14, 60, c, 14, 6.5, 3)}</g><circle class="p-disc" cx="60" cy="${c}" r="10"/>
        ${[[57, c - 3], [63, c - 2], [59, c + 3], [64, c + 3], [55, c + 2]].map(([x, y]) => `<circle class="p-seedpt" cx="${x}" cy="${y}" r="1"/>`).join('')}`;
    } else pianta += `<circle class="p-disc" cx="64" cy="${cima - 4}" r="8"/>`; // testa piegata, senza petali
  } else if (specie === 'basilico') {
    // ---------- basilico: cespuglio basso a coppie di foglie tonde; da adulto spighe di fiorellini ----------
    const rami = stadio === 3 ? [[60, 58]] : [[60, 52], [47, 64], [73, 64]];
    pianta = rami.map(([x, y]) => `<path class="p-stem" d="M60 100Q${(x + 60) / 2} ${(y + 100) / 2 + 6} ${x} ${y}" stroke-width="3"/>`).join('');
    for (const [x, y] of rami) {
      for (let i = 0; i < 3; i++) { const yy = y + 8 + i * 11, s = 0.95 - i * 0.05; pianta += dx(x, yy, -20 + i * 5, s) + sx(x, yy, 200 - i * 5, s, 'p-leaf2'); }
      pianta += dx(x, y + 1, -50, 0.6, 'p-leaf2') + sx(x, y + 1, 230, 0.6);
      if (stadio === 4 && fiori) pianta += `<g class="p-spike">${[0, 1, 2, 3].map(i => `<circle cx="${x + (i % 2 ? 1.5 : -1.5)}" cy="${y - 3 - i * 4}" r="2"/>`).join('')}</g>`;
    }
  } else if (stadio === 3 && !['olivo', 'ciliegio', 'quercia'].includes(specie)) {
    // ---------- pianta "classica" (nessuna specie scelta): stelo con foglie e un fiore ----------
    pianta = `<path class="p-stem" d="M60 100Q54 74 60 44" stroke-width="3.5"/>
      ${dx(58, 90, -15, 0.95)}${sx(57, 88, 195, 0.9)}${dx(57, 78, -25, 1)}${sx(57, 74, 205, 0.95, 'p-leaf2')}
      ${dx(58, 64, -30, 0.85, 'p-leaf2')}${sx(58, 60, 210, 0.8)}${dx(59, 52, -40, 0.65)}
      ${fiori ? `<g class="p-flower">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(60 + 5 * Math.cos(rad(a))).toFixed(1)}" cy="${(39 + 5 * Math.sin(rad(a))).toFixed(1)}" r="4"/>`).join('')}</g>
      <circle class="p-flower-c" cx="60" cy="39" r="3"/>` : ''}`;
  } else {
    // ---------- alberi: olivo, ciliegio, quercia e l'albero da frutto "classico" ----------
    const grande = stadio === 4;
    const tronco = specie === 'olivo'
      ? (grande ? 'M52 100C58 90 50 82 56 72C60 66 54 60 58 56h4c-2 6 4 10 0 16C58 80 66 90 66 100z' : 'M57 100C59 90 56 80 59 70h2c1 10-1 20 2 30z')
      : specie === 'quercia'
        ? (grande ? 'M50 100C54 86 54 74 56 62h8c2 12 2 24 6 38z' : 'M56 100C57 88 57 78 58 70h4c1 8 1 18 2 30z')
        : (grande ? 'M54 100C56 86 56 76 58 64h4c2 12 2 22 4 36z' : 'M57 100C58 90 58 80 59 72h2c1 8 1 18 2 28z');
    let chioma;
    if (specie === 'olivo') chioma = grande ? [[60, 48, 20], [40, 56, 13], [80, 56, 13], [48, 36, 12], [72, 36, 12]] : [[60, 62, 12], [50, 66, 8], [70, 66, 8]];
    else if (specie === 'quercia') chioma = grande ? [[60, 42, 26], [36, 54, 17], [84, 54, 17], [46, 26, 15], [74, 26, 15], [60, 18, 13]] : [[60, 58, 14], [48, 64, 9], [72, 64, 9], [60, 48, 9]];
    else chioma = grande ? [[60, 46, 24], [40, 56, 16], [80, 56, 16], [47, 32, 15], [73, 32, 15], [60, 22, 13]] : [[60, 60, 13], [49, 65, 9], [71, 65, 9], [60, 50, 9]];
    if (aspetto === 'appassita') chioma = chioma.filter((_, i) => i % 2 === 0); // la chioma si dirada
    const rosa = specie === 'ciliegio' && grande && fiori;
    pianta = `<path class="p-trunk" d="${tronco}"/>
      ${grande ? `<path class="p-stem p-branch" d="M59 74Q50 66 44 60M61 70Q70 62 76 56" stroke-width="3"/>` : ''}
      ${cerchi(chioma.map(([x, y, r]) => [x + 2, y + 3, r]), rosa ? 'p-bloom2' : 'p-canopy2')}${cerchi(chioma, rosa ? 'p-bloom' : 'p-canopy')}`;
    // frutti e fiori, solo se la pianta è in forma
    if (inForma && grande) {
      if (specie === 'olivo') pianta += [[46, 50], [70, 44], [58, 34], [78, 58], [40, 60], [64, 56]].map(([x, y]) => `<ellipse class="p-olive" cx="${x}" cy="${y}" rx="2" ry="2.8"/>`).join('');
      else if (specie === 'quercia') pianta += [[44, 52], [74, 46], [58, 30], [82, 60]].map(([x, y]) => `<ellipse class="p-acorn" cx="${x}" cy="${y + 1}" rx="2.2" ry="3"/><path class="p-cap" d="M${x - 2.6} ${y - 0.5}a2.6 2 0 0 1 5.2 0z"/>`).join('');
      else if (specie === 'ciliegio') pianta += cerchi([[48, 44, 2], [70, 38, 2], [58, 28, 2], [80, 58, 2], [38, 58, 2], [64, 52, 2]], 'p-blossom-w');
      else pianta += cerchi([[48, 50, 3], [70, 42, 3], [58, 30, 3], [80, 60, 3], [38, 60, 3]], 'p-fruit');
    }
    if (specie === 'ciliegio' && !grande && fiori) pianta += cerchi([[56, 56, 1.8], [66, 60, 1.8], [60, 48, 1.8]], 'p-bloom');
  }

  // foglie cadute a terra quando è appassita
  const cadute = aspetto === 'appassita' && stadio > 0 && specie !== 'cactus'
    ? f(16, 135, 8, 0.6, forma, 'p-leaf fallen') + f(104, 136, 172, 0.55, forma, 'p-leaf fallen') : '';

  return `<svg class="pianta aspetto-${aspetto}${specie ? ' specie-' + specie : ''}" width="${size}" height="${Math.round(size * 140 / 120)}" viewBox="0 0 120 140"
    ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} focusable="false">
    <ellipse class="p-ground" cx="60" cy="137" rx="50" ry="3"/>
    ${cadute}
    <g class="p-sway">${pianta}</g>
    <path class="p-pot" d="M32 104h56l-6 32H38z"/>
    <rect class="p-pot-rim" x="27" y="96" width="66" height="10" rx="3"/>
    <ellipse class="p-soil" cx="60" cy="98" rx="29" ry="3"/>
    ${sopra}
  </svg>`;
}
