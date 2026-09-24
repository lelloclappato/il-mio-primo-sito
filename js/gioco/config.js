// REGOLE DEL GIOCO DELLA PIANTA: tutti i numeri sono qui, in un unico posto.
// Per bilanciare il gioco basta cambiare questi valori (vedi i consigli nel README, sezione "La pianta").
//
// Esempio con 4 abitudini "medie" e sempre giornate perfette:
//   40 (abitudini) + 10 (serie salva) + 15 (giornata perfetta) = 65 punti al giorno,
//   fino a ~85 con il moltiplicatore della serie → albero in 66 giorni (germoglio 5, piantina 15, pianta 35):
//   66 giorni è il tempo medio perché un'abitudine diventi automatica (Lally, UCL, 2009).

export const CONFIG = {
  // punti per ogni abitudine completata, secondo la difficoltà scelta
  punti: { 1: 5, 2: 10, 3: 15 },          // 1 = facile, 2 = media, 3 = difficile

  // bonus del giorno
  bonusSerieSalva: 10,                     // fatte abbastanza abitudini per la serie (100% o 80%)
  bonusGiornataPerfetta: 15,               // fatte tutte (si somma al bonus precedente)

  // moltiplicatore della serie: +2% per ogni giorno di serie, al massimo +30% (dal 15° giorno)
  moltiplicatore: { perGiorno: 0.02, tetto: 0.30 },

  // stadi della pianta e punti necessari (la crescita non torna mai indietro)
  stadi: [
    { nome: 'Seme', articolo: 'un seme', punti: 0 },
    { nome: 'Germoglio', articolo: 'un germoglio', punti: 300 },
    { nome: 'Piantina', articolo: 'una piantina', punti: 1100 },
    { nome: 'Pianta', articolo: 'una pianta', punti: 2800 },
    { nome: 'Albero', articolo: 'un albero', punti: 5400 }
  ],

  // salute della pianta, da 0 a 100 (separata dalla crescita)
  salute: {
    iniziale: 80,
    minima: 10,                            // non scende mai sotto: la pianta non muore mai
    massima: 100,
    serieSalva: 10,                        // + in un giorno con la serie salva
    giornataPerfetta: 15,                  // + in un giorno perfetto (al posto del precedente)
    calo: 10,                              // − in un giorno previsto non riuscito
    caloMorbido: 5,                        // − se però era stata fatta almeno metà delle abitudini
    stanca: 60,                            // sotto questo valore i colori si spengono
    appassita: 35                          // sotto questo valore le foglie cadono
  },

  // salvagente: protegge automaticamente la serie nel primo giorno mancato del mese
  // (solo se c'è una serie da proteggere). Quel giorno non conta ma non la interrompe.
  salvagentiAlMese: 1,

  // medaglie per le abitudini a quantità: totale = obiettivo × questo numero (es. 2 L × 15 = 30 L)
  medagliaQuantita: 15
};
