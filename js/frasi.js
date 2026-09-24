// Citazione del giorno e frasi di incoraggiamento.
//
// CITAZIONI: solo frasi di cui l'autore è documentato. Molte citazioni famose su internet
// sono attribuite alla persona sbagliata (es. "Siamo ciò che facciamo ripetutamente…" non è
// di Aristotele ma di Will Durant, che lo riassumeva): quelle dubbie sono state escluse.
// Le traduzioni dall'originale sono libere. Per aggiungerne una basta una riga nell'elenco.

export const CITAZIONI = [
  { testo: 'Il viaggio di mille miglia comincia con un passo.', autore: 'Lao Tzu', fonte: 'Tao Te Ching' },
  { testo: 'Siamo ciò che facciamo ripetutamente. L’eccellenza, quindi, non è un atto ma un’abitudine.', autore: 'Will Durant', fonte: 'riassumendo Aristotele' },
  { testo: 'La goccia scava la pietra.', autore: 'Ovidio', fonte: 'Epistulae ex Ponto' },
  { testo: 'Non è perché le cose sono difficili che non osiamo; è perché non osiamo che sono difficili.', autore: 'Seneca', fonte: 'Lettere a Lucilio' },
  { testo: 'Le abitudini sono l’interesse composto del miglioramento personale.', autore: 'James Clear', fonte: 'Atomic Habits' },
  { testo: 'Chi ha cominciato è già a metà dell’opera.', autore: 'Orazio', fonte: 'Epistole' },
  { testo: 'Una rondine non fa primavera, né un solo giorno.', autore: 'Aristotele', fonte: 'Etica Nicomachea' },
  { testo: 'Quello che fai ogni giorno conta più di quello che fai ogni tanto.', autore: 'Gretchen Rubin' },
  { testo: 'Mentre si rimanda, la vita passa.', autore: 'Seneca', fonte: 'Lettere a Lucilio' },
  { testo: 'Cadi sette volte, rialzati otto.', autore: 'Proverbio giapponese' },
  { testo: 'Le cose che bisogna imparare per farle, le impariamo facendole.', autore: 'Aristotele', fonte: 'Etica Nicomachea' },
  { testo: 'Non ti elevi al livello dei tuoi obiettivi: scendi al livello dei tuoi sistemi.', autore: 'James Clear', fonte: 'Atomic Habits' },
  { testo: 'Il momento migliore per piantare un albero era vent’anni fa. Il secondo momento migliore è adesso.', autore: 'Proverbio' },
  { testo: 'La vita è come andare in bicicletta: per mantenere l’equilibrio devi muoverti.', autore: 'Albert Einstein', fonte: 'lettera al figlio Eduard' },
  { testo: 'Se non ora, quando?', autore: 'Hillel il Vecchio', fonte: 'Pirkè Avot' },
  { testo: 'Affrettati lentamente.', autore: 'Augusto', fonte: 'secondo Svetonio' },
  { testo: 'Il meglio è nemico del bene.', autore: 'Voltaire' },
  { testo: 'Ogni azione che compi è un voto per il tipo di persona che vuoi diventare.', autore: 'James Clear', fonte: 'Atomic Habits' },
  { testo: 'Nessun vento è favorevole per chi non sa in quale porto vuole andare.', autore: 'Seneca', fonte: 'Lettere a Lucilio' },
  { testo: 'Chi va piano va sano e va lontano.', autore: 'Proverbio italiano' },
  { testo: 'Compi ogni azione come se fosse l’ultima della tua vita.', autore: 'Marco Aurelio', fonte: 'Pensieri' },
  { testo: 'Tutte le cose sono difficili prima di diventare facili.', autore: 'Thomas Fuller', fonte: 'Gnomologia' },
  { testo: 'Fatti non foste a viver come bruti, ma per seguir virtute e canoscenza.', autore: 'Dante Alighieri', fonte: 'Inferno, canto XXVI' },
  { testo: 'Il coraggio non sempre ruggisce. A volte è la voce calma, a fine giornata, che dice: «Ci riproverò domani».', autore: 'Mary Anne Radmacher' },
  { testo: 'Roma non fu fatta in un giorno.', autore: 'Proverbio' },
  { testo: 'Chi ha un perché per vivere sopporta quasi ogni come.', autore: 'Friedrich Nietzsche', fonte: 'Crepuscolo degli idoli' },
  { testo: 'Non perdere altro tempo a discutere su come debba essere una persona buona. Sii una persona buona.', autore: 'Marco Aurelio', fonte: 'Pensieri' },
  { testo: 'Ogni giorno, sotto ogni aspetto, vado sempre meglio.', autore: 'Émile Coué' },
  { testo: 'Mente sana in corpo sano.', autore: 'Giovenale', fonte: 'Satire' },
  { testo: 'Fai quello che puoi, con quello che hai, dove sei.', autore: 'Theodore Roosevelt', fonte: 'citando Bill Widener' },
  { testo: 'Cogli l’attimo, confidando il meno possibile nel domani.', autore: 'Orazio', fonte: 'Odi' },
  { testo: 'Il genio è per l’uno per cento ispirazione e per il novantanove per cento traspirazione.', autore: 'Thomas Edison' },
  { testo: 'L’anima prende il colore dei suoi pensieri.', autore: 'Marco Aurelio', fonte: 'Pensieri' },
  { testo: 'Diventa ciò che sei.', autore: 'Pindaro', fonte: 'Pitiche' },
  { testo: 'Nulla di grande è mai stato fatto senza entusiasmo.', autore: 'Ralph Waldo Emerson', fonte: 'Cerchi' },
  { testo: 'Diventiamo giusti compiendo azioni giuste, temperanti compiendo azioni temperanti.', autore: 'Aristotele', fonte: 'Etica Nicomachea' },
  { testo: 'Il modo migliore per prevedere il futuro è inventarlo.', autore: 'Alan Kay' },
  { testo: 'Il tempo è la cosa più preziosa che si possa spendere.', autore: 'Teofrasto', fonte: 'secondo Diogene Laerzio' },
  { testo: 'Osa sapere.', autore: 'Orazio', fonte: 'Epistole («Sapere aude»)' },
  { testo: 'Conosci te stesso.', autore: 'Iscrizione del tempio di Apollo a Delfi' }
];

// La stessa citazione per tutto il giorno, una diversa ogni giorno (poi il giro ricomincia).
export function citazioneDelGiorno(chiaveGiorno) {
  const [y, m, g] = chiaveGiorno.split('-').map(Number);
  const n = Math.floor(Date.UTC(y, m - 1, g) / 864e5); // numero del giorno dal 1970
  return CITAZIONI[((n % CITAZIONI.length) + CITAZIONI.length) % CITAZIONI.length];
}

// ---------- frasi di incoraggiamento ----------
// Sempre positive: niente sensi di colpa. {n} = quante ne mancano, {s} = la serie che si raggiunge.
const FRASI = {
  inizio: [
    'Un passo alla volta: comincia dalla più facile.',
    'Oggi è una pagina bianca. Riempila con una piccola vittoria.',
    'Basta iniziare: il resto viene da sé.',
    'Scegline una e falla adesso: è il modo più semplice di partire.'
  ],
  inCorso: [
    'Stai andando bene: continua così!',
    'Ogni spunta conta. Sei sulla strada giusta.',
    'Bel ritmo! Ancora un po’ e ci sei.',
    'Stai costruendo qualcosa, un giorno alla volta.'
  ],
  unaSola: [
    'Ultimo sforzo: ne manca una sola!',
    'Sei a un passo dal traguardo di oggi.',
    'Ancora una e la giornata è tua.'
  ],
  sera: [
    'La giornata non è finita: c’è ancora tempo.',
    'Anche un piccolo passo stasera tiene viva la serie.',
    'Qualche minuto adesso e domani ti ringrazierai.'
  ],
  salva: [
    'Ottimo lavoro! Chiudere anche le ultime sarebbe la ciliegina sulla torta.',
    'Obiettivo di oggi raggiunto. Vuoi fare filotto?',
    'Ce l’hai fatta: il resto è un regalo in più per te.'
  ],
  completa: [
    'Giornata completa! Goditi il risultato.',
    'Tutto fatto: oggi hai mantenuto la parola con te stesso.',
    'Perfetto! Una giornata così fa crescere l’abitudine.'
  ]
};

// Sceglie una frase adatta alla situazione di oggi. La scelta dipende dal giorno,
// così la frase non cambia a ogni tocco ma solo quando cambia la situazione.
export function fraseMotivazionale({ previste, fatte, servono, ora, chiaveGiorno }) {
  let gruppo;
  if (!previste) return '';
  if (fatte >= previste) gruppo = 'completa';
  else if (fatte >= servono) gruppo = 'salva';
  else if (ora >= 19) gruppo = 'sera';
  else if (servono - fatte === 1) gruppo = 'unaSola';
  else if (fatte === 0) gruppo = 'inizio';
  else gruppo = 'inCorso';
  const lista = FRASI[gruppo];
  const n = Number(chiaveGiorno.replace(/-/g, '')) % lista.length;
  return lista[n];
}
