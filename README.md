# Le mie abitudini

App per tracciare le abitudini di ogni giorno, pensata per il telefono e installabile come app (PWA).
È fatta con HTML, CSS e JavaScript semplici, senza framework né strumenti di compilazione.

Indirizzo: https://lelloclappato.github.io/le-mie-abitudini/

## Cosa fa (v1.2)

- Abitudini **Sì / No** (es. palestra) e **a quantità** con obiettivo (es. acqua in litri, sonno in ore)
- Giorni della settimana a scelta per ogni abitudine: nei giorni non previsti non compare
- **Serie** di giorni consecutivi per ogni abitudine e **complessiva**, con il record. Per la serie complessiva
  scegli se servono **tutte** le abitudini previste o **circa l'80%**. I giorni non previsti non interrompono la serie;
  oggi non la interrompe finché non è finito. In "Oggi" vedi quante ne mancano per continuarla
- **Obiettivo di serie** (7, 14, 21, 30, 66 giorni o a scelta) con un **premio** scelto da te; se non lo scegli,
  al traguardo ricevi una **pillola di saggezza** (un consiglio pratico sulle abitudini)
- **Frasi di incoraggiamento** personalizzate (nomi delle abitudini che mancano, momento della giornata)
  e una **citazione del giorno** con il suo autore
- **Nota e umore** del giorno (facoltativi, 5 livelli)
- **Statistiche**: griglia delle ultime 20 settimane, percentuali della settimana e del mese, serie migliore,
  abitudine più costante, confronto tra umore e abitudini
- Si possono segnare anche i giorni passati
- **Backup** in un file JSON, con controllo completo del file prima di importarlo
- **Installabile** sul telefono e funzionante **senza connessione**
- **Promemoria** con notifica (con i limiti spiegati sotto) e numero di abitudini mancanti sull'icona
- Tema chiaro e scuro automatico, secondo le impostazioni del telefono

## Come si usa

- **Oggi**: le abitudini previste per il giorno. Tocca il cerchio per segnare quelle Sì/No, oppure − e + per le quantità
  (toccando il numero puoi scriverlo a mano). Le frecce cambiano giorno.
- **Statistiche**: serie attuale, percentuali e la griglia colorata (verde = fatta, corallo = saltata, grigio = non prevista).
- **Abitudini**: crea, modifica o elimina le abitudini; regola della serie (100% o 80%); promemoria; installazione;
  esporta e importa il backup.
- **Obiettivo di serie**: in "Oggi", nel riquadro della serie, tocca **Scegli un obiettivo di serie**. I giorni si contano
  da quando lo imposti; se la serie si interrompe, l'obiettivo resta e il conteggio riparte.

Per installarla sul telefono: apri il sito, poi "Aggiungi a schermata Home" (iPhone: pulsante Condividi in Safari;
Android: menu ⋮ di Chrome → "Installa app").

## Backup dei dati

I dati stanno **solo nel browser del dispositivo** (`localStorage`, chiave `abitudini-app-v1`): nessun server, nessun account.
Se cancelli i dati del browser o cambi telefono, li perdi. Per questo:

1. Scheda **Abitudini** → **Esporta backup (JSON)**: scarica un file `abitudini-backup-AAAA-MM-GG.json`.
2. Conservalo dove vuoi (Drive, email, computer).
3. Per recuperarlo: **Importa backup** e scegli il file. L'app controlla il file, mostra cosa contiene e chiede conferma.
   Prima di sostituire i dati ne salva una copia: se hai sbagliato file, tocca **Annulla l'ultima importazione**.

Se non fai un backup da più di 30 giorni, l'app te lo ricorda.

I dati delle versioni precedenti dell'app (`abitudini.v1`, `habits-tracker-v1`) vengono spostati automaticamente
nella chiave nuova al primo avvio, e restano nel browser come copia di sicurezza.

## Promemoria: cosa aspettarsi

Un'app web non può programmare una notifica a un orario preciso quando è chiusa, e le notifiche "push"
richiederebbero un server. Quindi:

- **Android (Chrome)**: la notifica arriva se a quell'ora l'app è aperta o è rimasta in sottofondo da poco.
- **iPhone / iPad**: le notifiche funzionano solo con l'app **installata** sulla schermata Home (iOS 16.4 o successivo),
  con lo stesso limite.
- Per un avviso sicuro ogni giorno conviene un evento ricorrente nel calendario (in arrivo nella Fase 4).

## Provarla sul computer

I moduli JavaScript non funzionano aprendo `index.html` con un doppio clic: serve un piccolo server locale.
Dalla cartella del progetto:

```
python3 -m http.server 8000
```

poi apri http://localhost:8000 nel browser.

**Test dei calcoli**: apri http://localhost:8000/tests/test.html. La pagina prova serie, percentuali, statistiche,
migrazione e controllo dei backup con dati inventati, e mostra in verde i test superati e in rosso quelli falliti.
Da riaprire dopo ogni modifica a `js/calcoli.js`, `js/migrazione.js` o `js/validazione.js`.

## Pubblicazione su GitHub Pages

La pubblicazione è automatica: a ogni push sul ramo `main`, GitHub esegue `.github/workflows/deploy-pages.yml`,
che copia i file del sito e li pubblica. Dopo un paio di minuti la nuova versione è online
(si può seguire l'avanzamento nella scheda **Actions** del repository).
Il workflow scrive anche il codice del commit come versione del service worker (`const VERSION` in `sw.js`):
così ogni pubblicazione crea una cache nuova e non serve cambiare niente a mano.
Sul telefono, alla prima apertura con internet dopo una pubblicazione, l'app scarica la nuova versione in sottofondo
e mostra **"È pronta una nuova versione – Aggiorna"**. Se aggiungi un file nuovo al sito, aggiungilo anche
all'elenco `FILES` in `sw.js`, altrimenti non sarà disponibile senza connessione.

## Struttura

- `index.html`: la pagina (solo lo scheletro)
- `css/style.css`: lo stile, con i colori per tema chiaro e scuro
- `fonts/`: i font Plus Jakarta Sans (testo) e Fraunces (titoli e numeri grandi), con le loro licenze (SIL Open Font License)
- `js/`: la logica, divisa in moduli JavaScript (`import` / `export`)
  - `app.js`: punto di partenza, collega i tocchi alle azioni
  - `dati.js`: lettura e salvataggio dei dati (anche nota e umore)
  - `migrazione.js`: formato dei dati e conversione dalle versioni vecchie
  - `validazione.js`: controllo dei file di backup
  - `calcoli.js`: giorni previsti, completamento, serie, percentuali, statistiche (funzioni "pure", testate)
  - `obiettivo.js`: obiettivo di serie, premio e festa al traguardo
  - `frasi.js`: citazioni del giorno (con autore verificato), frasi di incoraggiamento, pillole di saggezza
  - `pwa.js`: service worker, avviso di aggiornamento, installazione
  - `promemoria.js`: notifiche e numero sull'icona
  - `viste.js`: le schermate Oggi, Statistiche, Abitudini
  - `modulo.js`: il pannello per creare e modificare un'abitudine
  - `backup.js`: esporta e importa il file JSON
  - `icone.js`: le icone SVG (disegni di [Lucide](https://lucide.dev), licenza ISC)
  - `stato.js`, `utili.js`: stato dell'interfaccia e piccole funzioni comuni
- `sw.js`, `manifest.json`, `icon-*.png`: installazione e funzionamento offline
- `tests/`: i test dei calcoli (`test.html` da aprire nel browser)
- `.github/workflows/deploy-pages.yml`: pubblicazione su GitHub Pages

## Colori e contrasto

I colori sono variabili CSS all'inizio di `css/style.css`. Rapporti di contrasto verificati
(minimo richiesto: 4.5:1 per il testo, 3:1 per barre e icone):

| Coppia | Chiaro | Scuro |
|---|---|---|
| Testo su sfondo | 15.4 | 16.0 |
| Testo tenue (`--muted`) su sfondo | 5.7 | 8.2 |
| Testo tenue su scheda | 6.2 | 7.3 |
| Verde-acqua (`--accent`) su scheda | 5.5 | 8.9 |
| Testo sui pulsanti verde-acqua | 5.5 | 9.2 |
| Oro (`--gold-text`) su fondo oro tenue | 6.1 | 9.3 |
| Corallo (`--coral`) su scheda | 5.8 | 7.5 |
| Corallo su fondo corallo tenue | 4.9 | 6.5 |
| Barra completata (`--done`) sul binario | 3.2 | 9.6 |
| Barra in corso (`--accent`) sul binario | 4.45 | 7.2 |
