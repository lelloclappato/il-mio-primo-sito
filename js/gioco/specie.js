// Le piante tra cui scegliere. Crescono tutte con le stesse regole (config.js):
// cambiano l'aspetto, il nome degli stadi e le curiosità.
// Ogni pianta ha 5 curiosità: la prima si vede subito, le altre si sbloccano a ogni nuovo stadio.
// Sono informazioni botaniche verificabili; dove un dato è approssimativo lo si dice ("circa", "fino a").

export const SPECIE = [
  {
    id: 'basilico', nome: 'Basilico', latino: 'Ocimum basilicum',
    breve: 'Profumato e generoso: più lo curi, più foglie ti dà.',
    stadi: [['Seme', 'un seme'], ['Germoglio', 'un germoglio'], ['Piantina', 'una piantina'], ['Pianta', 'una pianta'], ['Cespuglio in fiore', 'un cespuglio in fiore']],
    curiosita: [
      'Il nome viene dal greco “basilikón”, che significa “regale”: per i Greci era un’erba da re.',
      'Appartiene alla famiglia delle Lamiacee, la stessa di menta, salvia, rosmarino e lavanda.',
      'È originario delle zone tropicali dell’Asia, soprattutto dell’India: per questo ama il caldo e soffre sotto i 10 °C.',
      'Se togli le cime con i fiori, la pianta invece di fare semi produce nuove foglie, più numerose e profumate.',
      'Il profumo viene da oli essenziali contenuti in minuscole ghiandole sulle foglie: basta sfiorarle per sentirlo.'
    ]
  },
  {
    id: 'girasole', nome: 'Girasole', latino: 'Helianthus annuus',
    breve: 'Alto e luminoso: da giovane segue il sole.',
    stadi: [['Seme', 'un seme'], ['Germoglio', 'un germoglio'], ['Piantina', 'una piantina'], ['Bocciolo', 'un bocciolo'], ['Girasole in fiore', 'un girasole in fiore']],
    curiosita: [
      '“Helianthus” viene dal greco: “hélios”, sole, e “ánthos”, fiore.',
      'È originario del Nord America, dove i popoli nativi lo coltivavano già diverse migliaia di anni fa.',
      'Da giovane gira la testa seguendo il sole da est a ovest; da adulto si ferma e resta rivolto a est, dove al mattino si scalda prima.',
      'Quello che sembra un solo fiore è un “capolino”: centinaia, a volte più di mille, piccoli fiori messi insieme.',
      'I semi al centro sono disposti su spirali che, contate, danno spesso numeri della successione di Fibonacci (come 34, 55, 89).'
    ]
  },
  {
    id: 'olivo', nome: 'Olivo', latino: 'Olea europaea',
    breve: 'Lento e tenace: può vivere più di mille anni.',
    stadi: [['Nocciolo', 'un nocciolo'], ['Germoglio', 'un germoglio'], ['Alberello', 'un alberello'], ['Giovane olivo', 'un giovane olivo'], ['Olivo', 'un olivo']],
    curiosita: [
      'È un sempreverde: ogni foglia resta sull’albero per circa due o tre anni prima di essere sostituita.',
      'Le foglie strette hanno la parte inferiore argentata, coperta di minuscoli peli che riducono la perdita d’acqua: per questo resiste alla siccità.',
      'Le olive appena raccolte sono amarissime per una sostanza chiamata oleuropeina: per mangiarle vanno lasciate in acqua o in salamoia.',
      'Il ramoscello d’olivo è simbolo di pace fin dall’antichità, e compare ancora oggi sulla bandiera delle Nazioni Unite.',
      'Può vivere per secoli: nel Mediterraneo, Italia compresa, esistono olivi considerati millenari.'
    ]
  },
  {
    id: 'cactus', nome: 'Cactus', latino: 'famiglia Cactaceae',
    breve: 'Resistente a tutto: con poca acqua va lontano.',
    stadi: [['Seme', 'un seme'], ['Germoglio', 'un germoglio'], ['Piccolo cactus', 'un piccolo cactus'], ['Cactus', 'un cactus'], ['Cactus in fiore', 'un cactus in fiore']],
    curiosita: [
      'Quasi tutti i cactus vengono dalle Americhe: dal Canada fino alla Patagonia.',
      'Le spine sono foglie trasformate: fanno perdere meno acqua, proteggono dagli animali e fanno un po’ d’ombra.',
      'Senza foglie vere, è il fusto verde a fare la fotosintesi e a fare da serbatoio per l’acqua.',
      'Molti cactus aprono i loro pori (gli stomi, sul fusto) di notte, quando fa più fresco, per perdere meno acqua: si chiama metabolismo CAM.',
      'Il saguaro, il cactus dei film western, può superare i 12 metri e vivere più di 150 anni.'
    ]
  },
  {
    id: 'ciliegio', nome: 'Ciliegio giapponese', latino: 'Prunus serrulata',
    breve: 'Una fioritura rosa che è una festa.',
    stadi: [['Seme', 'un seme'], ['Germoglio', 'un germoglio'], ['Alberello', 'un alberello'], ['Giovane ciliegio', 'un giovane ciliegio'], ['Ciliegio in fiore', 'un ciliegio in fiore']],
    curiosita: [
      'In Giappone si chiama “sakura”, e l’usanza di riunirsi sotto i ciliegi fioriti si chiama “hanami”, cioè “guardare i fiori”.',
      'La fioritura dura poco, circa una o due settimane: per questo è il simbolo della bellezza che passa.',
      'Molte varietà ornamentali non danno le ciliegie che mangiamo: sono coltivate solo per i fiori.',
      'In primavera le previsioni del tempo giapponesi seguono il “fronte dei ciliegi”, che sale da sud a nord man mano che fioriscono.',
      'Nel 1912 la città di Tokyo regalò a Washington circa 3.000 ciliegi: ogni primavera fioriscono ancora lungo il fiume Potomac.'
    ]
  },
  {
    id: 'quercia', nome: 'Quercia', latino: 'Quercus robur',
    breve: 'Forte e paziente: nasce da una ghianda.',
    stadi: [['Ghianda', 'una ghianda'], ['Germoglio', 'un germoglio'], ['Alberello', 'un alberello'], ['Giovane quercia', 'una giovane quercia'], ['Quercia', 'una quercia']],
    curiosita: [
      'Tutto inizia da una ghianda: il frutto della quercia, con il suo cappuccio a scaglie.',
      'Le ghiandaie nascondono le ghiande per l’inverno: quelle che dimenticano diventano nuove querce, anche lontano dall’albero.',
      'Una quercia adulta dà casa e cibo a centinaia di specie di insetti, uccelli, funghi e licheni.',
      'Il suo legno, duro e resistente, è stato usato per secoli per costruire navi, travi e botti.',
      'Può vivere diversi secoli: alcune querce europee si stima abbiano più di mille anni.'
    ]
  }
];

export const specieDa = id => SPECIE.find(s => s.id === id) || null;
