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

// ---------- frasi di incoraggiamento personalizzate ----------
// Semplici, dirette e sempre positive: niente sensi di colpa.
// Usano i nomi delle abitudini che mancano e il momento della giornata.

// momento della giornata dall'ora (0-23)
export function momento(ora) {
  if (ora >= 5 && ora < 12) return 'mattina';
  if (ora >= 12 && ora < 18) return 'pomeriggio';
  if (ora >= 18 && ora < 22) return 'sera';
  return 'notte';
}

// "Lettura", "Lettura e Diario", "Lettura, Diario e Yoga", "Lettura, Diario e altre 2"
export function elenco(nomi) {
  if (nomi.length <= 1) return nomi[0] || '';
  if (nomi.length <= 3) return nomi.slice(0, -1).join(', ') + ' e ' + nomi[nomi.length - 1];
  return nomi.slice(0, 2).join(', ') + ` e altre ${nomi.length - 2}`;
}

// Sceglie la frase giusta per la situazione. Parametri:
//   previste, fatte   → abitudini di oggi
//   servono           → quante ne servono per la serie (100% o 80%)
//   mancanti          → nomi delle abitudini non ancora fatte, nell'ordine della lista
//   serie             → serie complessiva attuale (senza oggi, se oggi non è ancora salvo)
//   ora               → ora attuale (0-23)
//   chiaveGiorno      → "AAAA-MM-GG": tra più varianti la scelta cambia ogni giorno, non a ogni tocco
export function fraseMotivazionale({ previste, fatte, servono, mancanti = [], serie = 0, ora, chiaveGiorno }) {
  if (!previste) return '';
  const m = momento(ora), prima = mancanti[0], n = servono - fatte;
  const varia = lista => lista[Number(chiaveGiorno.replace(/-/g, '')) % lista.length];
  const obiettivoSerie = serie > 0 ? 'continuare la serie' : 'iniziare la serie';

  // tutto fatto
  if (fatte >= previste) return m === 'mattina' || m === 'pomeriggio'
    ? varia(['Tutto fatto, e la giornata è ancora lunga: goditela!', 'Giornata perfetta già adesso. Ottimo lavoro!'])
    : varia(['Giornata perfetta! Goditi la serata.', 'Tutto fatto: oggi hai mantenuto la promessa fatta a te.']);

  // serie già salva (soglia 80%), mancano solo le ultime
  if (fatte >= servono) return `Serie al sicuro. Se ti va, chiudi anche ${elenco(mancanti)} per la giornata perfetta.`;

  // ne manca una sola per la serie
  if (n === 1) return m === 'sera' || m === 'notte'
    ? `Stasera ti manca solo ${prima} per ${obiettivoSerie}. Pochi minuti e ci sei!`
    : `Ti manca solo ${prima} per ${obiettivoSerie}!`;

  // appena iniziato: una fatta, spingere a continuare
  if (fatte === 1) return `Ottimo inizio! Adesso ${prima}, finché sei in ritmo.`;

  // niente ancora fatto
  if (fatte === 0) return {
    mattina: varia([`Buongiorno! Parti da ${prima}: il primo passo è il più importante.`, `Buongiorno! Togliti subito ${prima} e la giornata sarà in discesa.`]),
    pomeriggio: `Il pomeriggio è ancora lungo: comincia da ${prima}.`,
    sera: `C’è ancora tempo stasera: parti da ${prima}, anche solo per pochi minuti.`,
    notte: `Giornata piena? Anche solo ${prima} prima di dormire conta.`
  }[m];

  // a metà strada
  if (m === 'sera' || m === 'notte') return `Stasera ne mancano ${n} per ${obiettivoSerie}: ${elenco(mancanti.slice(0, n))}. Ce la puoi fare.`;
  return varia([`Stai andando bene: ${fatte} fatte! Prossima: ${prima}.`, `Bel ritmo! Ne mancano ${n}, a partire da ${prima}.`]);
}

// ---------- pillole di saggezza ----------
// Premio per un obiettivo di serie raggiunto senza una ricompensa scelta:
// consigli pratici sulle abitudini, con l'origine quando è un'idea nota.
export const PILLOLE = [
  { testo: 'Aggancia una nuova abitudine a una che fai già: “dopo il caffè del mattino, leggo due pagine”.', fonte: 'l’“habit stacking” di B. J. Fogg e James Clear' },
  { testo: 'Se un’abitudine ti pesa, falla durare due minuti. Iniziare conta più che fare tanto.', fonte: 'la “regola dei due minuti” di James Clear' },
  { testo: 'Saltare un giorno capita. Il segreto è non saltarne due di fila.', fonte: 'James Clear, Atomic Habits' },
  { testo: 'Rendi l’abitudine visibile: le scarpe da corsa vicino alla porta, il libro sul cuscino.' },
  { testo: 'Rendi le cattive abitudini scomode: il telefono in un’altra stanza vale più di mille buoni propositi.' },
  { testo: 'In media servono 66 giorni perché un gesto diventi automatico, ma saltarne uno ogni tanto non cambia il risultato.', fonte: 'studio di Phillippa Lally, University College London, 2009' },
  { testo: 'Decidi in anticipo “quando” e “dove”: “alle 7, in cucina, 10 minuti di stretching”. I piani precisi si rispettano di più.', fonte: 'le “intenzioni di attuazione” di Peter Gollwitzer' },
  { testo: 'Pensa a chi vuoi essere, non solo a cosa vuoi ottenere: “sono una persona che legge” invece di “devo leggere di più”.', fonte: 'James Clear, Atomic Habits' },
  { testo: 'Abbina qualcosa che devi fare a qualcosa che ti piace: il tuo podcast preferito solo mentre cammini.', fonte: 'il “temptation bundling” di Katherine Milkman' },
  { testo: 'Il sonno è il moltiplicatore di tutte le altre abitudini: proteggilo.' },
  { testo: 'Quando riparti dopo una pausa, riparti in piccolo. Il ritmo torna prima della forza.' },
  { testo: 'Festeggia subito dopo averla fatta, anche solo con un “ben fatto!”: il cervello ricorda ciò che lo fa stare bene.', fonte: 'B. J. Fogg, Tiny Habits' },
  { testo: 'Tieni traccia, ma non ossessionarti: il calendario serve a vedere i progressi, non a giudicarti.' },
  { testo: 'Cambia l’ambiente prima della forza di volontà: frutta sul tavolo, dolci in alto nell’armadio.' },
  { testo: 'Non aggiungere dieci abitudini insieme. Una alla volta, e la successiva quando la prima va da sola.' },
  { testo: 'Un obiettivo raggiunto è un buon momento per chiederti: questa abitudine mi fa ancora bene? Tenerla è una scelta, non un obbligo.' }
];

// ---------- domande della sera ----------
// Una domanda diversa ogni giorno per il diario: aiutano a scrivere anche quando non viene niente in mente.
export const DOMANDE_SERA = [
  'Qual è stato il momento migliore della giornata?',
  'Cosa ti ha fatto sorridere oggi?',
  'Una piccola vittoria di oggi?',
  'Cosa hai imparato oggi?',
  'Cosa faresti diversamente domani?',
  'Cosa ti ha dato energia oggi? E cosa te l’ha tolta?',
  'Cosa vuoi ricordare di questa giornata?',
  'Un gesto gentile che hai fatto o ricevuto oggi?',
  'Cosa hai fatto oggi solo per te?',
  'In tre parole, com’è stata la giornata?',
  'Cosa ti ha sorpreso oggi?',
  'Qual è la prima cosa che farai domani?',
  'Cosa hai notato oggi che di solito non noti?',
  'Per cosa provi gratitudine stasera?',
  'Qual è stata la cosa più difficile di oggi, e come l’hai affrontata?',
  'Con chi hai passato un bel momento oggi?',
  'Quale abitudine ti è venuta più facile oggi? Perché?',
  'Cosa diresti a chi eri stamattina?'
];
export function domandaDelGiorno(chiaveGiorno) {
  const n = Number(chiaveGiorno.replace(/-/g, ''));
  return DOMANDE_SERA[(n * 7) % DOMANDE_SERA.length];
}
