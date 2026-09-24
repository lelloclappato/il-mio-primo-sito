# Le mie abitudini

App per tracciare le abitudini di ogni giorno, installabile sul telefono (PWA). HTML, CSS e JavaScript puro, senza framework né build.

## Funzioni (v1.0)

- Abitudini Sì/No (es. palestra) e a quantità con obiettivo (es. acqua in litri, sonno in ore)
- Giorni della settimana a scelta per ogni abitudine
- Serie di giorni consecutivi, percentuali della settimana e del mese, storico degli ultimi 28 giorni
- Si possono segnare anche i giorni passati
- Backup ed esportazione in JSON, con promemoria dopo 30 giorni
- Dati solo nel browser (`localStorage`, chiave `abitudini-app-v1`): nessun server, nessun account. I dati delle versioni precedenti (`abitudini.v1`, `habits-tracker-v1`) vengono spostati automaticamente e restano come copia di sicurezza

## Struttura

- `index.html`: la pagina (solo lo scheletro)
- `css/style.css`: lo stile, con i colori per tema chiaro e scuro
- `js/`: la logica, divisa in moduli JavaScript (`import` / `export`), senza strumenti di compilazione
  - `app.js`: punto di partenza, collega i tocchi alle azioni
  - `dati.js`: lettura e salvataggio nel browser
  - `calcoli.js`: giorni previsti, completamento, serie, percentuali
  - `viste.js`: le schermate Oggi, Statistiche, Abitudini
  - `modulo.js`: il pannello per creare e modificare un'abitudine
  - `backup.js`: esporta e importa il file JSON
  - `stato.js`, `utili.js`: stato dell'interfaccia e piccole funzioni comuni
- `sw.js`, `manifest.json`, `icon-*.png`: installazione e funzionamento offline
- `.github/workflows/deploy-pages.yml`: pubblicazione su GitHub Pages a ogni push su `main`

## Provarla sul computer

I moduli JavaScript non funzionano aprendo `index.html` con un doppio clic: serve un piccolo server locale.
Dalla cartella del progetto:

```
python3 -m http.server 8000
```

poi apri http://localhost:8000 nel browser.
