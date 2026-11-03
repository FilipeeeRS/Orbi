import type { LegalTexts } from ".";

const fr: LegalTexts = {
  privacy: {
    title: "Politique de confidentialité",
    intro:
      "Cette politique explique quelles données personnelles Orbi collecte, pourquoi, avec qui elles sont partagées et comment vous les contrôlez, conformément à la loi brésilienne sur la protection des données (LGPD, loi 13.709/2018). En utilisant Orbi, vous acceptez aussi les {terms}. Ceci est une traduction ; en cas de doute, la version portugaise prévaut.",
    sections: [
      {
        id: "who",
        title: "Qui s'occupe de vos données",
        body: [
          "Orbi est un projet indépendant créé au Brésil et le responsable du traitement de vos données personnelles. Pour toute question de confidentialité, y compris en tant que délégué à la protection des données (DPO), écrivez à {email}.",
        ],
      },
      {
        id: "collect",
        title: "Données collectées",
        body: ["Nous ne collectons que ce dont Orbi a besoin pour fonctionner :"],
        list: [
          "Compte : e-mail, nom et mot de passe (stocké chiffré par notre fournisseur de connexion ; personne chez Orbi ne peut le voir). Si vous vous connectez avec Google, nous recevons le nom, l'e-mail et la photo que Google partage.",
          "Profil : nom d'utilisateur, nom affiché, bio, localisation, site web et pronoms (tous facultatifs sauf le nom d'utilisateur), photo, couverture, sticker, favoris, langue et préférences comme le profil invisible et le contenu pour adultes.",
          "Ce que vous enregistrez : statut, notes, j'aime, critiques, dates, épisodes vus, listes, commentaires, pièces jointes des critiques, personnes suivies, signalements envoyés et œuvres ajoutées au catalogue.",
          "Import Letterboxd : le fichier .zip est lu uniquement pour importer vos entrées ; le fichier lui-même n'est pas conservé.",
          "Appareils : le type de navigateur et de système (par exemple « Chrome · Windows ») et la date du premier accès, pour vous prévenir quand votre compte se connecte sur un nouvel appareil. Nous ne conservons pas votre adresse IP dans cette liste.",
          "Données techniques : nos hébergeurs et notre fournisseur de base de données enregistrent des données comme l'adresse IP et la date et l'heure des requêtes, pour la sécurité et le fonctionnement du service.",
        ],
      },
      {
        id: "not-collect",
        title: "Ce que nous ne collectons pas",
        body: [
          "Nous ne demandons ni numéro d'identité, ni adresse, ni téléphone, ni données de paiement, nous n'utilisons pas votre localisation précise et ne traitons pas volontairement de données sensibles (santé, religion, opinions politiques…). Nous ne vendons pas vos données, n'affichons pas de publicité et n'utilisons aucun outil de suivi ou d'analyse tiers.",
        ],
      },
      {
        id: "use",
        title: "Finalités et bases légales",
        list: [
          "Créer et gérer votre compte, conserver et afficher ce que vous enregistrez, envoyer les e-mails du compte (confirmation et réinitialisation du mot de passe) et montrer votre profil aux autres : exécution du contrat, c'est-à-dire de ces conditions (LGPD, art. 7, V).",
          "Sécurité, comme l'alerte de nouvel appareil, la prévention des abus et l'examen des signalements : intérêt légitime (art. 7, IX) et respect d'obligations légales (art. 7, II).",
          "Répondre aux demandes des autorités : respect d'une obligation légale ou d'une décision de justice.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "Ce qui est public",
        body: [
          "Votre profil, vos entrées, notes, critiques, listes, commentaires, j'aime et les personnes que vous suivez sont visibles par tous, même sans compte. Si vous rendez votre profil invisible dans les {settings}, vous seul voyez votre profil et votre activité. Votre e-mail n'est jamais montré aux autres.",
        ],
      },
      {
        id: "share",
        title: "Avec qui nous les partageons",
        body: ["Nous ne vendons ni ne louons de données. Elles passent uniquement par :"],
        list: [
          "Supabase (base de données, connexion et stockage de fichiers) et Vercel (hébergement du site), qui traitent les données pour notre compte.",
          "Google, uniquement si vous choisissez de vous connecter avec votre compte Google.",
          "TMDB, AniList, Open Library et Steam : les images et informations des œuvres sont chargées depuis leurs serveurs, qui reçoivent votre adresse IP, comme sur tout site affichant des images hébergées ailleurs.",
          "YouTube (youtube-nocookie.com) : uniquement quand vous cliquez pour voir une bande-annonce.",
          "MyMemory : uniquement quand vous cliquez sur Traduire dans une critique ; le texte est envoyé pour traduction.",
          "Les autorités publiques, lorsque la loi ou une décision de justice l'exige.",
        ],
      },
      {
        id: "transfer",
        title: "Transferts internationaux",
        body: [
          "Certains de ces fournisseurs stockent des données sur des serveurs hors du Brésil, par exemple aux États-Unis. Ce transfert est nécessaire pour fournir le service demandé (LGPD, art. 33) et se fait avec des fournisseurs qui appliquent des mesures de sécurité et des clauses de protection des données.",
        ],
      },
      {
        id: "retention",
        title: "Durée de conservation",
        body: [
          "Nous conservons vos données tant que votre compte existe. Lorsque vous le supprimez, nous effaçons immédiatement le profil, les entrées, critiques, listes, commentaires, j'aime, abonnés, appareils, photos et pièces jointes. Les sauvegardes des fournisseurs peuvent les conserver pendant une durée limitée avant d'être remplacées. Les œuvres que vous avez ajoutées au catalogue restent disponibles, sans lien avec vous. Nous pouvons conserver le minimum nécessaire pour respecter la loi ou nous défendre en justice.",
        ],
      },
      {
        id: "rights",
        title: "Vos droits",
        body: [
          "Selon la LGPD (art. 18), vous pouvez : confirmer que nous traitons vos données et y accéder ; corriger des données incomplètes ou erronées ; demander l'anonymisation, le blocage ou la suppression de données inutiles ; recevoir une copie de vos données (portabilité) ; savoir avec qui elles sont partagées ; retirer votre consentement ; et vous opposer à un traitement contraire à la loi.",
          "Vous pouvez presque tout faire vous-même dans les {settings} : modifier votre profil, télécharger une copie de vos données et supprimer votre compte. Pour le reste, écrivez à {email} ; nous répondons sous 15 jours. Vous pouvez aussi saisir l'Autorité nationale brésilienne de protection des données (ANPD).",
        ],
      },
      {
        id: "minors",
        title: "Enfants et adolescents",
        body: [
          "Orbi est destiné aux personnes de 13 ans ou plus. Entre 13 et 17 ans, l'autorisation d'un parent ou tuteur est nécessaire. Si nous apprenons qu'un compte appartient à une personne de moins de 13 ans, il sera supprimé. Les parents et tuteurs peuvent demander la suppression à {email}.",
        ],
      },
      {
        id: "security",
        title: "Sécurité",
        body: [
          "Nous utilisons une connexion chiffrée (HTTPS), des mots de passe stockés chiffrés et des règles d'accès dans la base de données pour que chacun ne modifie que ce qui lui appartient. Aucun système n'est totalement sûr ; en cas d'incident pouvant causer un risque ou un préjudice important, nous vous préviendrons, ainsi que l'ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: ["Nous n'utilisons que les cookies nécessaires au fonctionnement du site et à la mémorisation de vos choix. Détails dans la {cookies}."],
      },
      {
        id: "changes",
        title: "Modifications de cette politique",
        body: [
          "Nous pouvons mettre à jour cette politique. La date de la version en vigueur figure en haut de la page et, pour tout changement important, nous vous préviendrons sur le site avant son application.",
        ],
      },
    ],
  },
  terms: {
    title: "Conditions d'utilisation",
    intro:
      "Ces conditions constituent l'accord entre vous et Orbi. En créant un compte ou en utilisant le site, vous les acceptez, ainsi que la {privacy}. Si vous n'êtes pas d'accord, n'utilisez pas Orbi. Ceci est une traduction ; en cas de doute, la version portugaise prévaut.",
    sections: [
      {
        id: "service",
        title: "Qu'est-ce qu'Orbi",
        body: [
          "Orbi est un service gratuit et indépendant pour enregistrer et partager ce que vous regardez, lisez et jouez. Il est en développement : des fonctions peuvent changer, être suspendues ou arrêtées, et le site peut parfois être indisponible.",
        ],
      },
      {
        id: "account",
        title: "Votre compte",
        list: [
          "Vous devez avoir 13 ans ou plus. Entre 13 et 17 ans, uniquement avec l'autorisation d'un parent ou tuteur, qui est aussi responsable de l'utilisation.",
          "Utilisez des informations exactes et gardez votre mot de passe secret. Vous êtes responsable de ce qui est fait avec votre compte.",
          "Votre nom d'utilisateur ne peut pas usurper l'identité d'une autre personne, d'une marque ou d'une entreprise, ni être offensant.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "Votre contenu",
        body: [
          "Les critiques, notes, listes, commentaires et images que vous publiez restent à vous. En publiant, vous accordez à Orbi une licence gratuite, mondiale et non exclusive pour stocker, afficher, adapter le format (par exemple créer des miniatures ou traduire à la demande) et présenter ce contenu dans Orbi tant qu'il est publié.",
          "Vous garantissez avoir le droit de publier ce que vous envoyez. Les œuvres que vous ajoutez au catalogue restent disponibles pour tous, même après la suppression de votre compte.",
        ],
      },
      {
        id: "rules",
        title: "Ce qui est interdit",
        list: [
          "Publier du contenu illégal, des discours haineux, du harcèlement, des menaces ou des incitations à la violence.",
          "Publier de la nudité ou du contenu sexuel explicite ; tout contenu sexuel impliquant des mineurs est supprimé et signalé aux autorités.",
          "Exposer les données personnelles d'autrui ou usurper l'identité de quelqu'un.",
          "Envoyer du contenu piraté ou des liens vers celui-ci, ou utiliser des images et textes sans en avoir le droit.",
          "Rédiger de fausses critiques ou manipuler notes, j'aime et abonnés avec de faux comptes ou de l'automatisation.",
          "Faire du spam ou de la publicité de masse.",
          "Tenter de pirater, surcharger ou copier massivement le site, ou contourner des limites et règles d'accès.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Signalements et modération",
        body: [
          "Utilisez le bouton Signaler dans le menu des critiques, commentaires et listes ; pour les profils, écrivez à {email}. Nous pouvons retirer des contenus et suspendre ou supprimer des comptes qui enfreignent ces conditions ou la loi et, si possible, nous vous en indiquerons la raison.",
        ],
      },
      {
        id: "copyright",
        title: "Droits d'auteur et demandes de retrait",
        body: [
          "Si un contenu sur Orbi porte atteinte à vos droits (images comprises), écrivez à {email} avec le lien du contenu, le motif et un moyen de vous contacter. Nous examinons chaque demande et retirons ce qui est justifié.",
        ],
      },
      {
        id: "third-party",
        title: "Contenu de tiers",
        body: [
          "Les titres, synopsis, affiches, couvertures et autres données des œuvres proviennent de TMDB, AniList, Open Library et Steam et appartiennent à leurs ayants droit ; ils servent uniquement à identifier les œuvres. Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB. Orbi n'est affilié à aucun de ces services, ni à Letterboxd.",
          "Les notes et critiques sont les opinions de leurs auteurs, pas d'Orbi. Nous ne sommes pas responsables du contenu des sites externes vers lesquels nous renvoyons.",
        ],
      },
      {
        id: "warranty",
        title: "Garanties et responsabilité",
        body: [
          "Orbi est fourni en l'état, sans garantie d'être toujours disponible, sans erreur ou avec des informations toujours exactes sur les œuvres. Dans la mesure permise par la loi, nous ne sommes pas responsables des pertes de données, interruptions ou contenus publiés par les utilisateurs. Nous vous conseillons de télécharger régulièrement une copie de vos données dans les {settings}. Rien ici ne limite les droits dont vous disposez en tant que consommateur.",
        ],
      },
      {
        id: "end",
        title: "Résiliation",
        body: ["Vous pouvez supprimer votre compte à tout moment dans les {settings}. Nous pouvons fermer les comptes qui enfreignent ces conditions ou la loi."],
      },
      {
        id: "changes",
        title: "Modifications de ces conditions",
        body: [
          "Nous pouvons mettre à jour ces conditions. La date de la version en vigueur figure en haut de la page et, pour tout changement important, nous vous préviendrons sur le site avant son application. Continuer à utiliser Orbi ensuite vaut acceptation de la nouvelle version.",
        ],
      },
      {
        id: "law",
        title: "Droit applicable et contact",
        body: ["Ces conditions sont régies par le droit brésilien, et les tribunaux de votre lieu de résidence sont compétents. Questions, suggestions ou réclamations : {email}."],
      },
    ],
  },
  cookies: {
    title: "Politique relative aux cookies",
    intro:
      "Les cookies sont de petits fichiers qu'un site enregistre dans votre navigateur. Orbi n'utilise que les cookies et le stockage local nécessaires pour fonctionner et mémoriser vos choix. Nous n'utilisons pas de cookies publicitaires, de suivi ou d'analyse, c'est pourquoi nous ne demandons pas de consentement.",
    sections: [
      {
        id: "cookies",
        title: "Cookies utilisés",
        body: [],
        items: [
          ["sb-…-auth-token", "Vous garde connecté (Supabase). Dure jusqu'à la déconnexion ou l'expiration de la session."],
          ["orbi_locale", "Langue choisie. 1 an."],
          ["orbi-device", "Marque ce navigateur comme connu, pour l'alerte « nouvel appareil » de votre compte. 1 an."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Mémorisent les notifications vues, marquées comme lues ou non lues et supprimées. 1 an."],
          ["orbi-getting-started-hidden", "Mémorise que vous avez masqué Premiers pas sur l'Accueil. 1 an."],
        ],
      },
      {
        id: "storage",
        title: "Stockage local",
        body: ["Certains réglages restent uniquement dans votre navigateur et ne nous sont jamais envoyés :"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Thème et couleurs choisis."],
          ["orbi-login", "Votre e-mail ou nom d'utilisateur, uniquement si vous cochez « Se souvenir de moi » à la connexion."],
          ["orbi-nav-history", "Pages ouvertes dans cet onglet, pour que le bouton Retour fonctionne. Effacé à la fermeture de l'onglet."],
        ],
      },
      {
        id: "third-party",
        title: "Cookies de tiers",
        body: [
          "Orbi ne dépose pas de cookies de tiers. Si vous cliquez pour voir une bande-annonce, la vidéo vient de YouTube en mode de confidentialité renforcée (youtube-nocookie.com), qui peut enregistrer des données dans le navigateur selon la politique de Google. Lors de la connexion avec Google, la page de connexion de Google utilise ses propres cookies.",
        ],
      },
      {
        id: "control",
        title: "Comment les contrôler",
        body: [
          "Vous pouvez supprimer ou bloquer les cookies dans les réglages du navigateur, mais sans le cookie de session vous ne pouvez pas vous connecter. Se déconnecter supprime le cookie de session. Questions : {email}. Voir aussi la {privacy}.",
        ],
      },
    ],
  },
};

export default fr;
