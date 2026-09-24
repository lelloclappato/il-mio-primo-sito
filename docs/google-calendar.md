# Collegare Google Calendar: guida passo per passo

Questa parte la fai tu, una volta sola, nella **Google Cloud Console**. Serve a ottenere un **ID client**:
il "documento d'identità" dell'app presso Google. Ci vogliono circa 10 minuti.

> Google cambia spesso i nomi delle voci della console. Se una voce non corrisponde esattamente,
> cerca quella con il significato più vicino (in inglese i nomi sono tra parentesi).

## Cosa otterrai e cosa NO

- Otterrai un **ID client**, qualcosa come `123456789-abc…apps.googleusercontent.com`. È **pubblico**:
  va scritto nel codice del sito e da solo non dà accesso a niente.
- La console ti mostrerà anche un **client secret**. **Non copiarlo da nessuna parte**: il sito non ne ha bisogno
  e non deve mai finire nel codice (chiunque potrebbe leggerlo).

## 1. Crea il progetto

1. Vai su <https://console.cloud.google.com> ed entra con il tuo account Google.
2. In alto, accanto al logo, apri il menu dei progetti → **Nuovo progetto** (*New project*).
3. Nome: `Le mie abitudini` → **Crea**. Aspetta qualche secondo e assicurati che in alto sia selezionato il nuovo progetto.

## 2. Attiva l'API di Google Calendar

1. Menu ☰ → **API e servizi** (*APIs & Services*) → **Libreria** (*Library*).
2. Cerca **Google Calendar API**, aprila e premi **Abilita** (*Enable*).

## 3. Configura la schermata di consenso

È la finestra che Google ti mostrerà quando colleghi l'app. Nella console nuova si trova in
**Google Auth Platform** (menu ☰ → *APIs & Services* → *OAuth consent screen*, oppure cerca "Google Auth Platform").

1. Se è la prima volta, premi **Inizia** (*Get started*):
   - **Nome app**: `Le mie abitudini`
   - **Email di assistenza**: la tua email
   - **Pubblico** (*Audience*): **Esterno** (*External*)
   - **Dati di contatto**: la tua email
   - accetta le condizioni → **Crea**.
2. **Pubblico** (*Audience*):
   - lo stato di pubblicazione deve restare **In fase di test** (*Testing*): così l'app la puoi usare solo tu
     e chi aggiungi, e non serve la verifica di Google;
   - in **Utenti di test** (*Test users*) premi **Aggiungi utenti** e scrivi **il tuo indirizzo Gmail**.
3. **Accesso ai dati** (*Data access*) → **Aggiungi o rimuovi ambiti** (*Add or remove scopes*):
   cerca e spunta questi due (puoi incollarli nel campo "aggiungi manualmente"):
   - `https://www.googleapis.com/auth/calendar.events.readonly`
     → *Visualizzare gli eventi di tutti i calendari*: solo lettura, per mostrare gli impegni di oggi.
   - `https://www.googleapis.com/auth/calendar.app.created`
     → *Creare calendari secondari e gestire i loro eventi*: l'app può scrivere **solo** nel calendario
     "Le mie abitudini" che crea lei. I tuoi altri calendari restano intoccabili.

   Premi **Aggiorna** e poi **Salva**.

## 4. Crea l'ID client

1. In **Google Auth Platform** → **Client** (*Clients*) → **Crea client** (*Create client*).
2. **Tipo di applicazione**: **Applicazione web** (*Web application*). Nome: `Sito GitHub Pages`.
3. **Origini JavaScript autorizzate** (*Authorized JavaScript origins*) → **Aggiungi URI**:
   - `https://lelloclappato.github.io`  ← **senza** `/le-mie-abitudini` e senza `/` finale
   - `http://localhost:8000`  ← per provare sul computer
4. **URI di reindirizzamento autorizzati**: lascia **vuoto** (con il flusso "token" nel browser non servono).
5. Premi **Crea**. Compare una finestra con l'**ID client**: copialo. (Ignora il client secret.)

Le modifiche alle origini possono richiedere qualche minuto (a volte fino a un'ora) prima di funzionare.

## 5. Metti l'ID client nel sito

Apri `js/google/config.js` e incolla l'ID tra gli apici:

```js
export const GOOGLE_CLIENT_ID = '123456789-abc…apps.googleusercontent.com';
```

Poi fai commit e push (o chiedi a Claude di farlo). Dopo la pubblicazione, nella scheda **Abitudini**
comparirà il riquadro **Google Calendar** con il pulsante **Collega Google Calendar**.

## 6. Il primo collegamento

1. Tocca **Collega Google Calendar**: si apre la finestra di Google.
2. Comparirà l'avviso **"Google non ha verificato questa app"**: è normale per un'app personale in fase di test.
   Tocca **Continua** (*Continue*). Lo vedi solo tu perché sei l'unico utente di test.
3. Google elenca il permesso di sola lettura: conferma.
4. La prima volta che crei una fascia o attivi il riepilogo, Google chiede anche il secondo permesso
   (i calendari creati dall'app): conferma.

## Sicurezza e privacy, in breve

- Nel sito c'è **solo l'ID client**, che è pubblico. Nessun segreto.
- L'app riceve da Google un **token** che dura circa un'ora e resta **solo in memoria**: non viene salvato
  nel telefono. Chiudendo l'app sparisce; per rivederlo tocchi di nuovo "Collega" (di solito basta un tocco).
- Se rifiuti il permesso, se Google non risponde o se il token scade, l'app continua a funzionare normalmente:
  semplicemente la parte Google non si vede.
- **Scollega** (scheda Abitudini) revoca il token. Puoi anche togliere l'accesso da
  <https://myaccount.google.com/permissions>.
- Il calendario "Le mie abitudini" lo puoi nascondere o eliminare da Google Calendar come qualsiasi altro:
  se lo elimini, l'app ne crea uno nuovo alla prossima fascia o al prossimo riepilogo.

## Se qualcosa non va

| Messaggio o problema | Causa probabile | Soluzione |
|---|---|---|
| `Error 400: redirect_uri_mismatch` o `origin_mismatch` | L'indirizzo del sito non è tra le origini autorizzate | Controlla il punto 4.3: `https://lelloclappato.github.io` senza percorso; aspetta qualche minuto |
| `Error 403: access_denied` | Il tuo account non è tra gli utenti di test | Punto 3.2: aggiungi la tua Gmail |
| "Il permesso richiesto non è stato concesso" | Nella finestra di Google hai tolto la spunta a un permesso | Ricollega e lascia la spunta |
| La finestra di Google non si apre | Il browser blocca i popup | Consenti i popup per il sito |
| "Collegamento scaduto" | È passata circa un'ora | Tocca di nuovo "Collega" |
