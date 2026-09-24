# Le mie abitudini

App per tracciare le abitudini di ogni giorno, installabile sul telefono (PWA). HTML, CSS e JavaScript puro, senza framework né build.

## Funzioni (v1.0)

- Abitudini Sì/No (es. palestra) e a quantità con obiettivo (es. acqua in litri, sonno in ore)
- Giorni della settimana a scelta per ogni abitudine
- Serie di giorni consecutivi, percentuali della settimana e del mese, storico degli ultimi 28 giorni
- Si possono segnare anche i giorni passati
- Backup ed esportazione in JSON, con promemoria dopo 30 giorni
- Dati solo nel browser (`localStorage`): nessun server, nessun account

## Struttura

- `index.html`: pagina e stile
- `app.js`: logica
- `sw.js`, `manifest.json`, `icon-*.png`: installazione e funzionamento offline
- `.github/workflows/deploy-pages.yml`: pubblicazione su GitHub Pages ad ogni push su `main`
