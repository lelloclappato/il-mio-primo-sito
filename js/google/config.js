// Collegamento a Google Calendar (Fase 4, passo B).
//
// GOOGLE_CLIENT_ID è l'"ID client OAuth" creato nella Google Cloud Console (vedi docs/google-calendar.md).
// È un dato PUBBLICO: identifica l'app, non dà accesso a niente da solo. Il "client secret" invece
// NON va mai messo qui né in nessun file del sito: con il flusso "token" nel browser non serve.
// Finché è vuoto, la parte Google non compare e l'app funziona normalmente.
export const GOOGLE_CLIENT_ID = '';

// Permessi (scope), chiesti solo quando servono:
export const SCOPE_LETTURA = 'https://www.googleapis.com/auth/calendar.events.readonly'; // solo leggere gli eventi
export const SCOPE_SCRITTURA = 'https://www.googleapis.com/auth/calendar.app.created';   // solo i calendari creati da questa app

export const NOME_CALENDARIO = 'Le mie abitudini';
// orario in cui cercare spazi liberi per le abitudini
export const GIORNATA = { inizio: '07:00', fine: '22:00' };
