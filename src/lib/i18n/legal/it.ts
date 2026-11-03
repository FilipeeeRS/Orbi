import type { LegalTexts } from ".";

const it: LegalTexts = {
  privacy: {
    title: "Informativa sulla privacy",
    intro:
      "Questa informativa spiega quali dati personali raccoglie Orbi, per quali scopi, con chi li condivide e come puoi controllarli, secondo la legge brasiliana sulla protezione dei dati (LGPD, legge 13.709/2018). Usando Orbi accetti anche i {terms}. Questa è una traduzione; in caso di dubbio prevale la versione in portoghese.",
    sections: [
      {
        id: "who",
        title: "Chi si occupa dei tuoi dati",
        body: [
          "Orbi è un progetto indipendente nato in Brasile ed è il titolare del trattamento dei tuoi dati personali. Per qualsiasi questione di privacy, anche come responsabile della protezione dei dati (DPO), scrivi a {email}.",
        ],
      },
      {
        id: "collect",
        title: "Dati che raccogliamo",
        body: ["Raccogliamo solo ciò che serve perché Orbi funzioni:"],
        list: [
          "Account: e-mail, nome e password (conservata cifrata dal nostro fornitore di accesso; nessuno in Orbi può vederla). Se accedi con Google, riceviamo il nome, l'e-mail e la foto che Google condivide.",
          "Profilo: nome utente, nome visualizzato, bio, località, sito web e pronomi (tutti facoltativi tranne il nome utente), foto, copertina, sticker, preferiti, lingua e preferenze come profilo invisibile e contenuti per adulti.",
          "Ciò che registri: stato, voti, mi piace, recensioni, date, episodi visti, liste, commenti, allegati delle recensioni, persone che segui, segnalazioni che invii e opere che aggiungi al catalogo.",
          "Importazione da Letterboxd: il file .zip viene letto solo per importare le tue registrazioni; il file non viene conservato.",
          "Dispositivi: il tipo di browser e di sistema (per esempio \"Chrome · Windows\") e la data del primo accesso, per avvisarti quando il tuo account accede da un nuovo dispositivo. In questo elenco non conserviamo il tuo indirizzo IP.",
          "Dati tecnici: i nostri fornitori di hosting e database registrano dati come indirizzo IP, data e ora delle richieste, per sicurezza e per far funzionare il servizio.",
        ],
      },
      {
        id: "not-collect",
        title: "Cosa non raccogliamo",
        body: [
          "Non chiediamo documenti d'identità, indirizzo, telefono o dati di pagamento, non usiamo la tua posizione precisa e non trattiamo volutamente dati sensibili (come salute, religione o opinioni politiche). Non vendiamo i tuoi dati, non mostriamo pubblicità e non usiamo strumenti di tracciamento o analisi di terzi.",
        ],
      },
      {
        id: "use",
        title: "Finalità e basi giuridiche",
        list: [
          "Creare e gestire il tuo account, conservare e mostrare ciò che registri, inviare le e-mail dell'account (conferma e reimpostazione della password) e mostrare il tuo profilo agli altri: esecuzione del contratto, cioè di questi termini (LGPD, art. 7, V).",
          "Sicurezza, come l'avviso di nuovo dispositivo, la prevenzione degli abusi e l'esame delle segnalazioni: legittimo interesse (art. 7, IX) e adempimento di obblighi di legge (art. 7, II).",
          "Rispondere alle richieste delle autorità: adempimento di un obbligo di legge o di un ordine giudiziario.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "Cosa è pubblico",
        body: [
          "Il tuo profilo, le registrazioni, i voti, le recensioni, le liste, i commenti, i mi piace e chi segui possono essere visti da chiunque, anche senza account. Se rendi il profilo invisibile nelle {settings}, solo tu vedi il tuo profilo e le tue attività. La tua e-mail non viene mai mostrata agli altri.",
        ],
      },
      {
        id: "share",
        title: "Con chi li condividiamo",
        body: ["Non vendiamo né affittiamo dati. Passano solo attraverso:"],
        list: [
          "Supabase (database, accesso e archiviazione di file) e Vercel (hosting del sito), che trattano i dati per nostro conto.",
          "Google, solo se scegli di accedere con il tuo account Google.",
          "TMDB, AniList, Open Library e Steam: immagini e informazioni sulle opere vengono caricate dai loro server, che ricevono il tuo indirizzo IP, come in qualsiasi sito che mostra immagini ospitate altrove.",
          "YouTube (youtube-nocookie.com): solo quando fai clic per vedere un trailer.",
          "MyMemory: solo quando fai clic su Traduci in una recensione; il testo viene inviato per la traduzione.",
          "Autorità pubbliche, quando lo richiedono la legge o un ordine giudiziario.",
        ],
      },
      {
        id: "transfer",
        title: "Trasferimenti internazionali",
        body: [
          "Alcuni di questi fornitori conservano dati su server fuori dal Brasile, ad esempio negli Stati Uniti. Il trasferimento è necessario per fornire il servizio richiesto (LGPD, art. 33) e avviene con fornitori che adottano misure di sicurezza e clausole di protezione dei dati.",
        ],
      },
      {
        id: "retention",
        title: "Per quanto tempo li conserviamo",
        body: [
          "Conserviamo i tuoi dati finché esiste il tuo account. Quando lo elimini, cancelliamo subito profilo, registrazioni, recensioni, liste, commenti, mi piace, follower, dispositivi, foto e allegati. I backup dei fornitori possono conservarli per un periodo limitato finché non vengono sostituiti. Le opere che hai aggiunto al catalogo restano disponibili, senza legame con te. Possiamo conservare il minimo necessario per rispettare la legge o difenderci in giudizio.",
        ],
      },
      {
        id: "rights",
        title: "I tuoi diritti",
        body: [
          "Secondo la LGPD (art. 18) puoi: sapere se trattiamo i tuoi dati e accedervi; correggere dati incompleti o errati; chiedere l'anonimizzazione, il blocco o la cancellazione di dati non necessari; ricevere una copia dei tuoi dati (portabilità); sapere con chi li condividiamo; revocare il consenso; e opporti a trattamenti contrari alla legge.",
          "Quasi tutto puoi farlo da solo nelle {settings}: modificare il profilo, scaricare una copia dei tuoi dati ed eliminare l'account. Per il resto scrivi a {email}; rispondiamo entro 15 giorni. Puoi anche presentare reclamo all'Autorità nazionale brasiliana per la protezione dei dati (ANPD).",
        ],
      },
      {
        id: "minors",
        title: "Bambini e adolescenti",
        body: [
          "Orbi è per persone dai 13 anni in su. Chi ha tra 13 e 17 anni ha bisogno dell'autorizzazione di un genitore o tutore. Se scopriamo che un account appartiene a una persona sotto i 13 anni, verrà eliminato. Genitori e tutori possono chiederne la cancellazione a {email}.",
        ],
      },
      {
        id: "security",
        title: "Sicurezza",
        body: [
          "Usiamo connessioni cifrate (HTTPS), password conservate cifrate e regole di accesso nel database perché ognuno possa modificare solo ciò che è suo. Nessun sistema è del tutto sicuro; in caso di incidente che possa causare rischi o danni rilevanti, avviseremo te e l'ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookie",
        body: ["Usiamo solo i cookie necessari al funzionamento del sito e a ricordare le tue scelte. I dettagli sono nell'{cookies}."],
      },
      {
        id: "changes",
        title: "Modifiche a questa informativa",
        body: [
          "Possiamo aggiornare questa informativa. La data della versione in vigore è in cima alla pagina e, per modifiche importanti, avviseremo sul sito prima che entrino in vigore.",
        ],
      },
    ],
  },
  terms: {
    title: "Termini di utilizzo",
    intro:
      "Questi termini sono l'accordo tra te e Orbi. Creando un account o usando il sito li accetti, insieme all'{privacy}. Se non sei d'accordo, non usare Orbi. Questa è una traduzione; in caso di dubbio prevale la versione in portoghese.",
    sections: [
      {
        id: "service",
        title: "Cos'è Orbi",
        body: [
          "Orbi è un servizio gratuito e indipendente per registrare e condividere ciò che guardi, leggi e giochi. È in sviluppo: le funzioni possono cambiare, essere sospese o terminare, e il sito può talvolta non essere disponibile.",
        ],
      },
      {
        id: "account",
        title: "Il tuo account",
        list: [
          "Devi avere almeno 13 anni. Tra 13 e 17 anni, solo con l'autorizzazione di un genitore o tutore, che risponde anche dell'uso.",
          "Usa dati veri e tieni segreta la password. Sei responsabile di ciò che viene fatto con il tuo account.",
          "Il nome utente non può impersonare un'altra persona, marchio o azienda, né essere offensivo.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "I tuoi contenuti",
        body: [
          "Recensioni, voti, liste, commenti e immagini che pubblichi restano tuoi. Pubblicandoli concedi a Orbi una licenza gratuita, mondiale e non esclusiva per conservarli, mostrarli, adattarne il formato (per esempio creare miniature o tradurre su richiesta) e presentarli all'interno di Orbi finché restano pubblicati.",
          "Garantisci di avere il diritto di pubblicare ciò che invii. Le opere che aggiungi al catalogo restano disponibili per tutti, anche dopo l'eliminazione del tuo account.",
        ],
      },
      {
        id: "rules",
        title: "Cosa non è consentito",
        list: [
          "Pubblicare contenuti illegali, incitamento all'odio, molestie, minacce o incitamento alla violenza.",
          "Pubblicare nudità o contenuti sessuali espliciti; qualsiasi contenuto sessuale che coinvolga minori viene rimosso e segnalato alle autorità.",
          "Esporre dati personali altrui o spacciarti per qualcun altro.",
          "Caricare contenuti pirata o link a essi, o usare immagini e testi senza averne il diritto.",
          "Scrivere recensioni false o manipolare voti, mi piace e follower con account falsi o automazioni.",
          "Fare spam o pubblicità di massa.",
          "Tentare di violare, sovraccaricare o copiare in massa il sito, o aggirare limiti e regole di accesso.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Segnalazioni e moderazione",
        body: [
          "Usa il pulsante Segnala nel menu di recensioni, commenti e liste; per i profili scrivi a {email}. Possiamo rimuovere contenuti e sospendere o eliminare account che violano questi termini o la legge e, quando possibile, ti diremo il motivo.",
        ],
      },
      {
        id: "copyright",
        title: "Diritto d'autore e richieste di rimozione",
        body: [
          "Se un contenuto su Orbi viola i tuoi diritti (immagini comprese), scrivi a {email} indicando il link al contenuto, il motivo e un recapito. Esaminiamo ogni richiesta e rimuoviamo ciò che risulta fondato.",
        ],
      },
      {
        id: "third-party",
        title: "Contenuti di terzi",
        body: [
          "Titoli, trame, poster, copertine e altri dati delle opere provengono da TMDB, AniList, Open Library e Steam e appartengono ai rispettivi titolari; servono solo a identificare le opere. Questo prodotto usa l'API di TMDB ma non è approvato né certificato da TMDB. Orbi non è affiliato a nessuno di questi servizi né a Letterboxd.",
          "Voti e recensioni sono opinioni dei loro autori, non di Orbi. Non rispondiamo del contenuto dei siti esterni collegati.",
        ],
      },
      {
        id: "warranty",
        title: "Garanzie e responsabilità",
        body: [
          "Orbi è fornito così com'è, senza garanzia di essere sempre disponibile, privo di errori o con informazioni sulle opere sempre corrette. Nei limiti consentiti dalla legge, non rispondiamo di perdite di dati, interruzioni o contenuti pubblicati dagli utenti. Ti consigliamo di scaricare ogni tanto una copia dei tuoi dati nelle {settings}. Nulla di quanto sopra limita i tuoi diritti di consumatore.",
        ],
      },
      {
        id: "end",
        title: "Chiusura",
        body: ["Puoi eliminare il tuo account quando vuoi nelle {settings}. Possiamo chiudere gli account che violano questi termini o la legge."],
      },
      {
        id: "changes",
        title: "Modifiche a questi termini",
        body: [
          "Possiamo aggiornare questi termini. La data della versione in vigore è in cima alla pagina e, per modifiche importanti, avviseremo sul sito prima che entrino in vigore. Continuare a usare Orbi dopo significa accettare la nuova versione.",
        ],
      },
      {
        id: "law",
        title: "Legge applicabile e contatti",
        body: ["Questi termini sono regolati dalla legge brasiliana ed è competente il foro del tuo luogo di residenza. Domande, suggerimenti o reclami: {email}."],
      },
    ],
  },
  cookies: {
    title: "Informativa sui cookie",
    intro:
      "I cookie sono piccoli file che un sito salva nel tuo browser. Orbi usa solo cookie e archiviazione locale necessari per funzionare e ricordare le tue scelte. Non usiamo cookie pubblicitari, di tracciamento o di analisi, per questo non chiediamo il consenso.",
    sections: [
      {
        id: "cookies",
        title: "Cookie che usiamo",
        body: [],
        items: [
          ["sb-…-auth-token", "Ti mantiene connesso (Supabase). Dura finché non esci o la sessione scade."],
          ["orbi_locale", "Lingua scelta. 1 anno."],
          ["orbi-device", "Segna questo browser come già noto, per l'avviso di \"nuovo dispositivo\" sul tuo account. 1 anno."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Ricordano quali notifiche hai visto, segnato come lette o non lette ed eliminato. 1 anno."],
          ["orbi-welcome-seen", "Ricorda che hai già visto il benvenuto di Orbi. 1 anno."],
        ],
      },
      {
        id: "storage",
        title: "Archiviazione locale",
        body: ["Alcune impostazioni restano solo nel tuo browser e non ci vengono mai inviate:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Tema e colori che hai scelto."],
          ["orbi-login", "La tua e-mail o il nome utente, solo se spunti \"Ricordami\" all'accesso."],
          ["orbi-nav-history", "Pagine aperte in questa scheda, perché il pulsante Indietro funzioni. Si cancella quando chiudi la scheda."],
        ],
      },
      {
        id: "third-party",
        title: "Cookie di terze parti",
        body: [
          "Orbi non imposta cookie di terze parti. Se fai clic per vedere un trailer, il video arriva da YouTube in modalità di privacy avanzata (youtube-nocookie.com), che può salvare dati nel browser secondo la policy di Google. Quando accedi con Google, la pagina di accesso di Google usa i propri cookie.",
        ],
      },
      {
        id: "control",
        title: "Come controllarli",
        body: [
          "Puoi cancellare o bloccare i cookie nelle impostazioni del browser, ma senza il cookie di sessione non puoi accedere. Uscire dall'account cancella il cookie di sessione. Domande: {email}. Vedi anche l'{privacy}.",
        ],
      },
    ],
  },
};

export default it;
