# Le mie abitudini

App per tracciare le abitudini di ogni giorno, pensata per il telefono e installabile come app (PWA).
È fatta con HTML, CSS e JavaScript semplici, senza framework né strumenti di compilazione.

Indirizzo: https://lelloclappato.github.io/le-mie-abitudini/

## Cosa fa (v1.1)

- Abitudini **Sì / No** (es. palestra) e **a quantità** con obiettivo (es. acqua in litri, sonno in ore)
- Giorni della settimana a scelta per ogni abitudine: nei giorni non previsti non compare
- Serie di giorni consecutivi, percentuali della settimana e del mese, griglia degli ultimi 28 giorni
- Si possono segnare anche i giorni passati
- Tema chiaro e scuro automatico, secondo le impostazioni del telefono
- Funziona anche senza connessione, dopo la prima apertura

## Come si usa

- **Oggi**: le abitudini previste per il giorno. Tocca il cerchio per segnare quelle Sì/No, oppure − e + per le quantità
  (toccando il numero puoi scriverlo a mano). Le frecce cambiano giorno.
- **Statistiche**: serie attuale, percentuali e la griglia colorata (verde = fatta, corallo = saltata, grigio = non prevista).
- **Abitudini**: crea, modifica o elimina le abitudini; esporta e importa il backup.

Per installarla sul telefono: apri il sito, poi "Aggiungi a schermata Home" (iPhone: pulsante Condividi in Safari;
Android: menu ⋮ di Chrome → "Installa app").

## Backup dei dati

I dati stanno **solo nel browser del dispositivo** (`localStorage`, chiave `abitudini-app-v1`): nessun server, nessun account.
Se cancelli i dati del browser o cambi telefono, li perdi. Per questo:

1. Scheda **Abitudini** → **Esporta backup (JSON)**: scarica un file `abitudini-backup-AAAA-MM-GG.json`.
2. Conservalo dove vuoi (Drive, email, computer).
3. Per recuperarlo: **Importa backup** e scegli il file. Attenzione: sostituisce tutti i dati attuali.

Se non fai un backup da più di 30 giorni, l'app te lo ricorda.

I dati delle versioni precedenti dell'app (`abitudini.v1`, `habits-tracker-v1`) vengono spostati automaticamente
nella chiave nuova al primo avvio, e restano nel browser come copia di sicurezza.

## Provarla sul computer

I moduli JavaScript non funzionano aprendo `index.html` con un doppio clic: serve un piccolo server locale.
Dalla cartella del progetto:

```
python3 -m http.server 8000
```

poi apri http://localhost:8000 nel browser.

## Pubblicazione su GitHub Pages

La pubblicazione è automatica: a ogni push sul ramo `main`, GitHub esegue `.github/workflows/deploy-pages.yml`,
che copia i file del sito e li pubblica. Dopo un paio di minuti la nuova versione è online
(si può seguire l'avanzamento nella scheda **Actions** del repository).
Sul telefono l'app si aggiorna alla prima apertura con internet.

## Struttura

- `index.html`: la pagina (solo lo scheletro)
- `css/style.css`: lo stile, con i colori per tema chiaro e scuro
- `fonts/`: i font Plus Jakarta Sans (testo) e Fraunces (titoli e numeri grandi), con le loro licenze (SIL Open Font License)
- `js/`: la logica, divisa in moduli JavaScript (`import` / `export`)
  - `app.js`: punto di partenza, collega i tocchi alle azioni
  - `dati.js`: lettura, salvataggio e migrazione dei dati
  - `calcoli.js`: giorni previsti, completamento, serie, percentuali
  - `viste.js`: le schermate Oggi, Statistiche, Abitudini
  - `modulo.js`: il pannello per creare e modificare un'abitudine
  - `backup.js`: esporta e importa il file JSON
  - `icone.js`: le icone SVG (disegni di [Lucide](https://lucide.dev), licenza ISC)
  - `stato.js`, `utili.js`: stato dell'interfaccia e piccole funzioni comuni
- `sw.js`, `manifest.json`, `icon-*.png`: installazione e funzionamento offline
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
