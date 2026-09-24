// Coriandoli leggeri per i festeggiamenti.
// Non partono se l'utente li ha disattivati (scheda Traguardi) o se il sistema chiede
// meno animazioni (prefers-reduced-motion). Sono solo decorazione: aria-hidden.

const COLORI = ['var(--done)', 'var(--gold)', 'var(--accent)', 'var(--coral)', 'var(--flower)'];

export function lanciaCoriandoli(attivi = true) {
  if (!attivi || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'coriandoli';
  box.setAttribute('aria-hidden', 'true');
  let html = '';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 100, ritardo = Math.random() * 0.6, durata = 1.8 + Math.random() * 1.2;
    const giro = Math.round(Math.random() * 720 - 360), deriva = Math.round(Math.random() * 80 - 40);
    html += `<i style="left:${x}%;background:${COLORI[i % COLORI.length]};animation-delay:${ritardo}s;animation-duration:${durata}s;--giro:${giro}deg;--deriva:${deriva}px"></i>`;
  }
  box.innerHTML = html;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3500); // poi spariscono del tutto
}
