import type { LegalTexts } from ".";

const de: LegalTexts = {
  privacy: {
    title: "Datenschutzerklärung",
    intro:
      "Diese Erklärung beschreibt, welche personenbezogenen Daten Orbi erhebt, wofür, mit wem sie geteilt werden und wie du sie kontrollierst, gemäß dem brasilianischen Datenschutzgesetz (LGPD, Gesetz 13.709/2018). Mit der Nutzung von Orbi stimmst du auch den {terms} zu. Dies ist eine Übersetzung; im Zweifel gilt die portugiesische Fassung.",
    sections: [
      {
        id: "who",
        title: "Wer für deine Daten verantwortlich ist",
        body: [
          "Orbi ist ein unabhängiges Projekt aus Brasilien und Verantwortlicher für deine personenbezogenen Daten. Für alle Datenschutzfragen, auch als Datenschutzbeauftragter (DPO), schreib an {email}.",
        ],
      },
      {
        id: "collect",
        title: "Welche Daten wir erheben",
        body: ["Wir erheben nur, was Orbi zum Funktionieren braucht:"],
        list: [
          "Konto: E-Mail, Name und Passwort (verschlüsselt bei unserem Anmeldedienst gespeichert; niemand bei Orbi kann es sehen). Wenn du dich mit Google anmeldest, erhalten wir Name, E-Mail und Foto, die Google teilt.",
          "Profil: Benutzername, Anzeigename, Bio, Ort, Website und Pronomen (alles optional außer dem Benutzernamen), Foto, Titelbild, Sticker, Favoriten, Sprache und Einstellungen wie unsichtbares Profil und Inhalte für Erwachsene.",
          "Was du einträgst: Status, Bewertungen, Likes, Rezensionen, Daten, gesehene Folgen, Listen, Kommentare, Anhänge von Rezensionen, Personen, denen du folgst, Meldungen, die du sendest, und Titel, die du zum Katalog hinzufügst.",
          "Letterboxd-Import: Die .zip-Datei wird nur gelesen, um deine Einträge zu übernehmen; die Datei selbst wird nicht gespeichert.",
          "Geräte: Browser- und Systemtyp (zum Beispiel „Chrome · Windows“) und das Datum des ersten Zugriffs, um dich zu warnen, wenn sich dein Konto auf einem neuen Gerät anmeldet. Deine IP-Adresse speichern wir in dieser Liste nicht.",
          "Technische Daten: Unsere Hosting- und Datenbankanbieter protokollieren Daten wie IP-Adresse sowie Datum und Uhrzeit der Anfragen, aus Sicherheitsgründen und für den Betrieb.",
        ],
      },
      {
        id: "not-collect",
        title: "Was wir nicht erheben",
        body: [
          "Wir fragen nicht nach Ausweisnummern, Adresse, Telefon oder Zahlungsdaten, nutzen nicht deinen genauen Standort und verarbeiten nicht absichtlich sensible Daten (wie Gesundheit, Religion oder politische Meinung). Wir verkaufen deine Daten nicht, zeigen keine Werbung und nutzen keine Tracking- oder Analysetools von Dritten.",
        ],
      },
      {
        id: "use",
        title: "Zwecke und Rechtsgrundlagen",
        list: [
          "Dein Konto anlegen und führen, deine Einträge speichern und anzeigen, Konto-E-Mails senden (Bestätigung und Passwort-Zurücksetzung) und dein Profil anderen zeigen: Vertragserfüllung, also dieser Bedingungen (LGPD, Art. 7, V).",
          "Sicherheit, etwa die Warnung bei neuen Geräten, Missbrauchsvermeidung und Prüfung von Meldungen: berechtigtes Interesse (Art. 7, IX) und Erfüllung gesetzlicher Pflichten (Art. 7, II).",
          "Beantwortung behördlicher Anfragen: Erfüllung einer gesetzlichen Pflicht oder gerichtlichen Anordnung.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "Was öffentlich ist",
        body: [
          "Dein Profil, deine Einträge, Bewertungen, Rezensionen, Listen, Kommentare, Likes und wem du folgst, kann jeder sehen, auch ohne Konto. Wenn du dein Profil in den {settings} unsichtbar machst, siehst nur du dein Profil und deine Aktivität. Deine E-Mail wird anderen nie angezeigt.",
        ],
      },
      {
        id: "share",
        title: "Mit wem wir Daten teilen",
        body: ["Wir verkaufen und vermieten keine Daten. Sie laufen nur über:"],
        list: [
          "Supabase (Datenbank, Anmeldung und Dateispeicher) und Vercel (Hosting der Website), die Daten in unserem Auftrag verarbeiten.",
          "Google, nur wenn du dich mit deinem Google-Konto anmeldest.",
          "TMDB, AniList, Open Library und Steam: Bilder und Informationen zu Titeln werden von deren Servern geladen, die dabei deine IP-Adresse erhalten, wie bei jeder Website, die anderswo gehostete Bilder zeigt.",
          "YouTube (youtube-nocookie.com): nur wenn du auf einen Trailer klickst.",
          "MyMemory: nur wenn du bei einer Rezension auf Übersetzen klickst; der Text wird zur Übersetzung gesendet.",
          "Behörden, wenn Gesetz oder Gericht es verlangen.",
        ],
      },
      {
        id: "transfer",
        title: "Übermittlung ins Ausland",
        body: [
          "Einige dieser Anbieter speichern Daten auf Servern außerhalb Brasiliens, etwa in den USA. Die Übermittlung ist nötig, um den gewünschten Dienst zu erbringen (LGPD, Art. 33), und erfolgt an Anbieter mit Sicherheitsmaßnahmen und Datenschutzklauseln.",
        ],
      },
      {
        id: "retention",
        title: "Wie lange wir Daten speichern",
        body: [
          "Wir speichern deine Daten, solange dein Konto besteht. Wenn du es löschst, entfernen wir sofort Profil, Einträge, Rezensionen, Listen, Kommentare, Likes, Follower, Geräte, Fotos und Anhänge. Backups der Anbieter können diese Daten begrenzt aufbewahren, bis sie überschrieben werden. Titel, die du zum Katalog hinzugefügt hast, bleiben verfügbar, ohne Bezug zu dir. Wir können das Minimum aufbewahren, das zur Erfüllung gesetzlicher Pflichten oder zur Verteidigung in Verfahren nötig ist.",
        ],
      },
      {
        id: "rights",
        title: "Deine Rechte",
        body: [
          "Nach der LGPD (Art. 18) kannst du: bestätigen lassen, ob wir deine Daten verarbeiten, und darauf zugreifen; unvollständige oder falsche Daten berichtigen; die Anonymisierung, Sperrung oder Löschung unnötiger Daten verlangen; eine Kopie deiner Daten erhalten (Übertragbarkeit); erfahren, mit wem wir sie teilen; Einwilligungen widerrufen; und rechtswidriger Verarbeitung widersprechen.",
          "Fast alles erledigst du selbst in den {settings}: Profil bearbeiten, eine Kopie deiner Daten herunterladen und dein Konto löschen. Für alles andere schreib an {email}; wir antworten innerhalb von 15 Tagen. Du kannst dich auch bei der brasilianischen Datenschutzbehörde (ANPD) beschweren.",
        ],
      },
      {
        id: "minors",
        title: "Kinder und Jugendliche",
        body: [
          "Orbi ist für Personen ab 13 Jahren. Wer zwischen 13 und 17 ist, braucht die Erlaubnis eines Elternteils oder Erziehungsberechtigten. Erfahren wir, dass ein Konto jemandem unter 13 gehört, wird es gelöscht. Eltern und Erziehungsberechtigte können die Löschung unter {email} verlangen.",
        ],
      },
      {
        id: "security",
        title: "Sicherheit",
        body: [
          "Wir nutzen verschlüsselte Verbindungen (HTTPS), verschlüsselt gespeicherte Passwörter und Zugriffsregeln in der Datenbank, damit jede Person nur ihre eigenen Daten ändern kann. Kein System ist völlig sicher; bei einem Vorfall, der ein erhebliches Risiko oder einen Schaden verursachen kann, informieren wir dich und die ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: ["Wir verwenden nur Cookies, die für den Betrieb der Website und das Merken deiner Einstellungen nötig sind. Details in der {cookies}."],
      },
      {
        id: "changes",
        title: "Änderungen dieser Erklärung",
        body: [
          "Wir können diese Erklärung aktualisieren. Das Datum der aktuellen Fassung steht oben auf der Seite, und bei wichtigen Änderungen informieren wir auf der Website, bevor sie gelten.",
        ],
      },
    ],
  },
  terms: {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Bedingungen sind die Vereinbarung zwischen dir und Orbi. Wenn du ein Konto erstellst oder die Website nutzt, stimmst du ihnen und der {privacy} zu. Wenn du nicht einverstanden bist, nutze Orbi nicht. Dies ist eine Übersetzung; im Zweifel gilt die portugiesische Fassung.",
    sections: [
      {
        id: "service",
        title: "Was Orbi ist",
        body: [
          "Orbi ist ein kostenloser, unabhängiger Dienst, um festzuhalten und zu teilen, was du schaust, liest und spielst. Er befindet sich in Entwicklung: Funktionen können sich ändern, pausiert oder eingestellt werden, und die Website kann zeitweise offline sein.",
        ],
      },
      {
        id: "account",
        title: "Dein Konto",
        list: [
          "Du musst mindestens 13 Jahre alt sein. Zwischen 13 und 17 nur mit Erlaubnis eines Elternteils oder Erziehungsberechtigten, der auch für die Nutzung verantwortlich ist.",
          "Verwende wahre Angaben und halte dein Passwort geheim. Du bist für alles verantwortlich, was mit deinem Konto geschieht.",
          "Dein Benutzername darf keine andere Person, Marke oder Firma vortäuschen und nicht beleidigend sein.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "Deine Inhalte",
        body: [
          "Rezensionen, Bewertungen, Listen, Kommentare und Bilder, die du veröffentlichst, gehören weiterhin dir. Mit der Veröffentlichung gibst du Orbi eine kostenlose, weltweite, nicht exklusive Lizenz, diese Inhalte innerhalb von Orbi zu speichern, anzuzeigen, im Format anzupassen (etwa Vorschaubilder erstellen oder auf Wunsch übersetzen) und zu zeigen, solange sie veröffentlicht sind.",
          "Du versicherst, das Recht zu haben, das Hochgeladene zu veröffentlichen. Titel, die du zum Katalog hinzufügst, bleiben für alle verfügbar, auch nachdem du dein Konto gelöscht hast.",
        ],
      },
      {
        id: "rules",
        title: "Was nicht erlaubt ist",
        list: [
          "Illegale Inhalte, Hassrede, Belästigung, Drohungen oder Aufrufe zur Gewalt veröffentlichen.",
          "Nacktheit oder explizite sexuelle Inhalte veröffentlichen; sexuelle Inhalte mit Minderjährigen werden entfernt und den Behörden gemeldet.",
          "Persönliche Daten anderer offenlegen oder dich als jemand anderes ausgeben.",
          "Raubkopien oder Links darauf hochladen oder Bilder und Texte ohne Recht verwenden.",
          "Gefälschte Rezensionen schreiben oder Bewertungen, Likes und Follower mit Fake-Konten oder Automatisierung manipulieren.",
          "Spam oder Massenwerbung.",
          "Versuchen, die Website zu hacken, zu überlasten oder massenhaft zu kopieren, oder Limits und Zugriffsregeln zu umgehen.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Meldungen und Moderation",
        body: [
          "Nutze die Schaltfläche Melden im Menü von Rezensionen, Kommentaren und Listen; bei Profilen schreib an {email}. Wir können Inhalte entfernen und Konten sperren oder löschen, die gegen diese Bedingungen oder das Gesetz verstoßen, und nennen dir nach Möglichkeit den Grund.",
        ],
      },
      {
        id: "copyright",
        title: "Urheberrecht und Löschanträge",
        body: [
          "Wenn ein Inhalt auf Orbi deine Rechte verletzt (auch Bilder), schreib an {email} mit dem Link zum Inhalt, dem Grund und einer Kontaktmöglichkeit. Wir prüfen jeden Antrag und entfernen, was berechtigt ist.",
        ],
      },
      {
        id: "third-party",
        title: "Inhalte Dritter",
        body: [
          "Titel, Inhaltsangaben, Poster, Cover und andere Daten der Werke stammen von TMDB, AniList, Open Library und Steam und gehören ihren Rechteinhabern; sie dienen nur zur Identifizierung der Werke. Dieses Produkt verwendet die TMDB-API, ist aber nicht von TMDB unterstützt oder zertifiziert. Orbi ist mit keinem dieser Dienste und nicht mit Letterboxd verbunden.",
          "Bewertungen und Rezensionen sind Meinungen ihrer Verfasser, nicht von Orbi. Für Inhalte verlinkter externer Websites übernehmen wir keine Verantwortung.",
        ],
      },
      {
        id: "warranty",
        title: "Gewährleistung und Haftung",
        body: [
          "Orbi wird so bereitgestellt, wie es ist, ohne Garantie, dass es immer verfügbar, fehlerfrei oder mit stets korrekten Informationen zu den Werken ist. Soweit gesetzlich zulässig, haften wir nicht für Datenverlust, Ausfälle oder von Nutzern veröffentlichte Inhalte. Wir empfehlen, ab und zu eine Kopie deiner Daten in den {settings} herunterzuladen. Nichts hiervon schränkt deine Rechte als Verbraucher ein.",
        ],
      },
      {
        id: "end",
        title: "Beendigung",
        body: ["Du kannst dein Konto jederzeit in den {settings} löschen. Wir können Konten schließen, die gegen diese Bedingungen oder das Gesetz verstoßen."],
      },
      {
        id: "changes",
        title: "Änderungen dieser Bedingungen",
        body: [
          "Wir können diese Bedingungen aktualisieren. Das Datum der aktuellen Fassung steht oben auf der Seite, und bei wichtigen Änderungen informieren wir auf der Website, bevor sie gelten. Wenn du Orbi danach weiter nutzt, akzeptierst du die neue Fassung.",
        ],
      },
      {
        id: "law",
        title: "Anwendbares Recht und Kontakt",
        body: ["Für diese Bedingungen gilt brasilianisches Recht; zuständig sind die Gerichte deines Wohnorts. Fragen, Vorschläge oder Beschwerden: {email}."],
      },
    ],
  },
  cookies: {
    title: "Cookie-Richtlinie",
    intro:
      "Cookies sind kleine Dateien, die eine Website in deinem Browser speichert. Orbi verwendet nur Cookies und lokalen Speicher, die zum Funktionieren und zum Merken deiner Einstellungen nötig sind. Wir nutzen keine Werbe-, Tracking- oder Analyse-Cookies und fragen daher nicht nach Einwilligung.",
    sections: [
      {
        id: "cookies",
        title: "Verwendete Cookies",
        body: [],
        items: [
          ["sb-…-auth-token", "Hält dich angemeldet (Supabase). Gilt, bis du dich abmeldest oder die Sitzung abläuft."],
          ["orbi_locale", "Gewählte Sprache. 1 Jahr."],
          ["orbi-device", "Markiert diesen Browser als bekannt, für die Warnung „neues Gerät“ in deinem Konto. 1 Jahr."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Merken, welche Benachrichtigungen du gesehen, als gelesen oder ungelesen markiert und gelöscht hast. 1 Jahr."],
          ["orbi-getting-started-hidden", "Merkt, dass du die Ersten Schritte auf der Startseite ausgeblendet hast. 1 Jahr."],
        ],
      },
      {
        id: "storage",
        title: "Lokaler Speicher",
        body: ["Einige Einstellungen bleiben nur in deinem Browser und werden nie an uns gesendet:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Gewähltes Design und Farben."],
          ["orbi-login", "Deine E-Mail oder dein Benutzername, nur wenn du beim Anmelden „Angemeldet bleiben“ ankreuzt."],
          ["orbi-nav-history", "In diesem Tab geöffnete Seiten, damit die Zurück-Schaltfläche funktioniert. Wird beim Schließen des Tabs gelöscht."],
        ],
      },
      {
        id: "third-party",
        title: "Cookies von Drittanbietern",
        body: [
          "Orbi setzt keine Cookies von Drittanbietern. Wenn du auf einen Trailer klickst, kommt das Video von YouTube im erweiterten Datenschutzmodus (youtube-nocookie.com), der nach Googles Richtlinie Daten im Browser speichern kann. Bei der Anmeldung mit Google nutzt die Anmeldeseite von Google eigene Cookies.",
        ],
      },
      {
        id: "control",
        title: "So steuerst du sie",
        body: [
          "Du kannst Cookies in den Browsereinstellungen löschen oder blockieren, aber ohne das Sitzungscookie kannst du dich nicht anmelden. Abmelden löscht das Sitzungscookie. Fragen: {email}. Siehe auch die {privacy}.",
        ],
      },
    ],
  },
};

export default de;
