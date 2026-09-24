// Disegno della pianta in SVG, costruito in codice.
// 5 stadi (0 seme → 4 albero) e 3 aspetti secondo la salute:
//   'ok'        colori pieni, un leggero ondeggiare
//   'stanca'    colori spenti (li cambia il CSS con le variabili --leaf...)
//   'appassita' foglie piegate verso il basso e qualche foglia caduta a terra
// Il disegno sta in un riquadro 120×140; il vaso è in basso, la terra a y=100.

// forma di una foglia che parte da (0,0) e punta a destra, lunga 20
const FOGLIA = 'M0 0C5-6 14-7 20 0C14 7 5 6 0 0Z';

// foglia in posizione (x,y), ruotata di `ang` gradi, ingrandita di `s`
function foglia(x, y, ang, s, cls = 'p-leaf') {
  return `<path class="${cls}" d="${FOGLIA}" transform="translate(${x} ${y}) rotate(${ang}) scale(${s})"/>`;
}

export function svgPianta(stadio, aspetto = 'ok', { size = 120, label = '' } = {}) {
  // quanto si piegano le foglie: a destra l'angolo aumenta (verso il basso), a sinistra diminuisce
  const giu = aspetto === 'appassita' ? 28 : aspetto === 'stanca' ? 10 : 0;
  const dx = (x, y, ang, s, cls) => foglia(x, y, ang + giu, s, cls);          // foglia verso destra
  const sx = (x, y, ang, s, cls) => foglia(x, y, ang - giu, s, cls);          // foglia verso sinistra

  let pianta = '', sopra = '';   // "sopra" va disegnato davanti al vaso (il seme sta sulla terra)
  if (stadio === 0) {
    // seme appoggiato nella terra, con un filo di germoglio
    sopra = `<ellipse class="p-seed" cx="60" cy="96" rx="7" ry="4.5"/>
      <path class="p-stem" d="M62 92q2-5 6-6" stroke-width="2"/>`;
  } else if (stadio === 1) {
    pianta = `<path class="p-stem" d="M60 100Q59 91 60 83" stroke-width="3"/>
      ${dx(60, 84, -35, 0.65)}${sx(60, 84, 215, 0.65)}`;
  } else if (stadio === 2) {
    pianta = `<path class="p-stem" d="M60 100Q56 82 60 64" stroke-width="3"/>
      ${dx(59, 90, -20, 0.8)}${sx(58, 81, 200, 0.85)}${dx(58, 73, -30, 0.8)}
      ${dx(60, 65, -45, 0.55, 'p-leaf2')}${sx(60, 65, 225, 0.55, 'p-leaf2')}`;
  } else if (stadio === 3) {
    pianta = `<path class="p-stem" d="M60 100Q54 74 60 44" stroke-width="3.5"/>
      ${dx(58, 90, -15, 0.95)}${sx(57, 88, 195, 0.9)}${dx(57, 78, -25, 1)}${sx(57, 74, 205, 0.95, 'p-leaf2')}
      ${dx(58, 64, -30, 0.85, 'p-leaf2')}${sx(58, 60, 210, 0.8)}${dx(59, 52, -40, 0.65)}
      ${aspetto === 'appassita' ? '' : `<g class="p-flower">${[0, 72, 144, 216, 288].map(a =>
        `<circle cx="${60 + 5 * Math.cos(a * Math.PI / 180)}" cy="${39 + 5 * Math.sin(a * Math.PI / 180)}" r="4"/>`).join('')}</g>
      <circle class="p-flower-c" cx="60" cy="39" r="3"/>`}`;
  } else {
    // albero: tronco, rami, chioma fatta di cerchi, frutti se è in forma
    const chioma = aspetto === 'appassita'
      ? [[60, 48, 22], [42, 58, 14], [78, 58, 14], [60, 30, 13]]
      : [[60, 46, 24], [40, 56, 16], [80, 56, 16], [47, 32, 15], [73, 32, 15], [60, 22, 13]];
    pianta = `<path class="p-trunk" d="M54 100C56 86 56 76 58 64h4c2 12 2 22 4 36z"/>
      <path class="p-stem" d="M59 74Q50 66 44 60M61 70Q70 62 76 56" stroke-width="3"/>
      ${chioma.map(([x, y, r]) => `<circle class="p-canopy2" cx="${x + 2}" cy="${y + 3}" r="${r}"/>`).join('')}
      ${chioma.map(([x, y, r]) => `<circle class="p-canopy" cx="${x}" cy="${y}" r="${r}"/>`).join('')}
      ${aspetto === 'ok' ? [[48, 50], [70, 42], [58, 30], [80, 60], [38, 60]].map(([x, y]) => `<circle class="p-fruit" cx="${x}" cy="${y}" r="3"/>`).join('') : ''}`;
  }

  // foglie cadute a terra quando è appassita (non per il seme)
  const cadute = aspetto === 'appassita' && stadio > 0
    ? foglia(16, 135, 8, 0.6, 'p-leaf fallen') + foglia(104, 136, 172, 0.55, 'p-leaf fallen') : '';

  return `<svg class="pianta aspetto-${aspetto}" width="${size}" height="${Math.round(size * 140 / 120)}" viewBox="0 0 120 140"
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
