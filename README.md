# Le mie abitudini

Una piccola app web per tracciare le abitudini quotidiane, costruita con HTML, CSS e JavaScript puro, senza framework né build step.

## Funzionalità

- Aggiungi abitudini da seguire ogni giorno
- Segna il completamento per gli ultimi 7 giorni con un tap
- Streak (giorni consecutivi) calcolata automaticamente per ogni abitudine
- Statistiche generali: abitudini attive, % completate oggi, streak migliore
- Dati salvati nel browser (`localStorage`): niente server, niente account

## Come vederla

Apri il file `index.html` in un browser, oppure servi la cartella con un semplice server statico (es. `python3 -m http.server`).

## Struttura

- `index.html` — markup dell'app
- `style.css` — stile
- `app.js` — logica (gestione abitudini, streak, persistenza)
