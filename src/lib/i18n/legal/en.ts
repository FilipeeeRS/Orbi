import type { LegalTexts } from ".";

const en: LegalTexts = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains what personal data Orbi collects, why, who it is shared with and how you control it, in line with Brazil's General Data Protection Law (LGPD, Law 13,709/2018). By using Orbi you also agree to the {terms}. This is a translation; if there is any doubt, the Portuguese version prevails.",
    sections: [
      {
        id: "who",
        title: "Who looks after your data",
        body: [
          "Orbi is an independent project made in Brazil and is the controller of your personal data. For any privacy matter, including as data protection officer (DPO), write to {email}.",
        ],
      },
      {
        id: "collect",
        title: "Data we collect",
        body: ["We only collect what Orbi needs to work:"],
        list: [
          "Account: email, name and password (stored encrypted by our sign-in provider; nobody at Orbi can see it). If you sign in with Google, we receive the name, email and photo Google shares.",
          "Profile: username, display name, bio, location, website and pronouns (all optional except the username), photo, cover, sticker, favorites, language and preferences such as invisible profile and adult content.",
          "What you log: status, ratings, likes, reviews, dates, watched episodes, lists, comments, review attachments, people you follow, reports you send and titles you add to the catalog.",
          "Letterboxd import: the .zip file is read only to bring in your entries; the file itself is not kept.",
          "Devices: the browser and system type (for example, \"Chrome · Windows\") and the date of first access, to warn you when your account signs in on a new device. We do not store your IP address in this list.",
          "Technical data: our hosting and database providers log data such as IP address and request date and time, for security and to run the service.",
        ],
      },
      {
        id: "not-collect",
        title: "What we don't collect",
        body: [
          "We don't ask for ID numbers, address, phone or payment details, we don't use your precise location and we don't intentionally process sensitive data (such as health, religion or political opinion). We don't sell your data, show ads or use third-party tracking or analytics tools.",
        ],
      },
      {
        id: "use",
        title: "How we use it and on what legal basis",
        list: [
          "Creating and keeping your account, storing and showing what you log, sending account emails (confirmation and password reset) and showing your profile to others: performance of a contract, that is, these terms (LGPD, art. 7, V).",
          "Security, such as the new-device warning, abuse prevention and reviewing reports: legitimate interest (art. 7, IX) and compliance with legal obligations (art. 7, II).",
          "Answering requests from authorities: compliance with a legal obligation or court order.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "What is public",
        body: [
          "Your profile, entries, ratings, reviews, lists, comments, likes and who you follow can be seen by anyone, even without an account. If you make your profile invisible in {settings}, only you can see your profile and activity. Your email is never shown to others.",
        ],
      },
      {
        id: "share",
        title: "Who we share it with",
        body: ["We don't sell or rent data. It only goes through:"],
        list: [
          "Supabase (database, sign-in and file storage) and Vercel (website hosting), which process data on our behalf.",
          "Google, only if you choose to sign in with your Google account.",
          "TMDB, AniList, Open Library and Steam: images and title information load from their servers, which receive your IP address, as on any site that shows images hosted elsewhere.",
          "YouTube (youtube-nocookie.com): only when you click to watch a trailer.",
          "MyMemory: only when you click Translate on a review; the review text is sent for translation.",
          "Public authorities, when required by law or court order.",
        ],
      },
      {
        id: "transfer",
        title: "International transfers",
        body: [
          "Some of these providers store data on servers outside Brazil, such as in the United States. The transfer is needed to provide the service you asked for (LGPD, art. 33) and uses providers that adopt security measures and data protection clauses.",
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        body: [
          "We keep your data while your account exists. When you delete your account, we immediately erase your profile, entries, reviews, lists, comments, likes, followers, devices, photos and attachments. Provider backups may keep this data for a limited time until they are replaced. Titles you added to the catalog stay available, with no link to you. We may keep the minimum needed to comply with the law or defend ourselves in legal proceedings.",
        ],
      },
      {
        id: "rights",
        title: "Your rights",
        body: [
          "Under the LGPD (art. 18) you can: confirm whether we process your data and access it; correct incomplete or wrong data; ask for anonymization, blocking or deletion of unnecessary data; get a copy of your data (portability); know who we share it with; withdraw consent; and object to processing that breaks the law.",
          "You can do almost everything yourself in {settings}: edit your profile, download a copy of your data and delete your account. For anything else, write to {email}; we reply within 15 days. You can also complain to Brazil's National Data Protection Authority (ANPD).",
        ],
      },
      {
        id: "minors",
        title: "Children and teenagers",
        body: [
          "Orbi is for people aged 13 or over. Anyone aged 13 to 17 needs permission from a parent or guardian. If we learn an account belongs to someone under 13, it will be deleted. Parents and guardians can ask for deletion at {email}.",
        ],
      },
      {
        id: "security",
        title: "Security",
        body: [
          "We use encrypted connections (HTTPS), encrypted password storage and database access rules so each person can only change what is theirs. No system is completely secure; if an incident may cause relevant risk or harm, we will tell you and the ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: ["We only use cookies needed for the site to work and remember your choices. See the details in the {cookies}."],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        body: [
          "We may update this policy. The date of the current version is at the top of the page and, for important changes, we will give notice on the site before they apply.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    intro:
      "These terms are the agreement between you and Orbi. By creating an account or using the site, you agree to them and to the {privacy}. If you don't agree, don't use Orbi. This is a translation; if there is any doubt, the Portuguese version prevails.",
    sections: [
      {
        id: "service",
        title: "What Orbi is",
        body: [
          "Orbi is a free, independent service to log and share what you watch, read and play. It is under development: features may change, be paused or end, and the site may sometimes be offline.",
        ],
      },
      {
        id: "account",
        title: "Your account",
        list: [
          "You must be 13 or older. From 13 to 17, only with permission from a parent or guardian, who is also responsible for the use.",
          "Use true information and keep your password secret. You are responsible for what is done with your account.",
          "Your username can't impersonate another person, brand or company, or be offensive.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "Your content",
        body: [
          "Reviews, ratings, lists, comments and images you post remain yours. By posting, you give Orbi a free, worldwide, non-exclusive license to store, display, adapt the format of (for example, make thumbnails or translate when someone asks) and show that content inside Orbi while it is published.",
          "You confirm you have the right to post what you upload. Titles you add to the catalog stay available to everyone, even after you delete your account.",
        ],
      },
      {
        id: "rules",
        title: "What is not allowed",
        list: [
          "Posting illegal content, hate speech, harassment, threats or incitement to violence.",
          "Posting nudity or explicit sexual content; any sexual content involving minors is removed and reported to the authorities.",
          "Exposing other people's personal data or impersonating someone.",
          "Uploading pirated content or links to it, or using images and texts you have no right to.",
          "Writing fake reviews or manipulating ratings, likes and followers with fake accounts or automation.",
          "Spam or mass advertising.",
          "Trying to break into, overload or mass-copy the site, or get around limits and access rules.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Reports and moderation",
        body: [
          "Use the Report button in the menu of reviews, comments and lists; for profiles, write to {email}. We may remove content and suspend or delete accounts that break these terms or the law, and whenever possible we will tell you why.",
        ],
      },
      {
        id: "copyright",
        title: "Copyright and takedown requests",
        body: [
          "If any content on Orbi infringes your rights (including images), write to {email} with the link to the content, the reason and a way to contact you. We review every request and remove what is justified.",
        ],
      },
      {
        id: "third-party",
        title: "Third-party content",
        body: [
          "Titles, synopses, posters, covers and other title data come from TMDB, AniList, Open Library and Steam and belong to their owners; they are used only to identify the works. This product uses the TMDB API but is not endorsed or certified by TMDB. Orbi is not affiliated with any of these services or with Letterboxd.",
          "Ratings and reviews are the opinions of their authors, not of Orbi. We are not responsible for the content of external sites we link to.",
        ],
      },
      {
        id: "warranty",
        title: "Warranties and liability",
        body: [
          "Orbi is provided as is, with no guarantee that it will always be available, error-free or have correct title information. To the extent permitted by law, we are not liable for data loss, downtime or content posted by users. We recommend downloading a copy of your data now and then in {settings}. Nothing here limits rights you have under consumer protection law.",
        ],
      },
      {
        id: "end",
        title: "Ending",
        body: ["You can delete your account whenever you want in {settings}. We may close accounts that break these terms or the law."],
      },
      {
        id: "changes",
        title: "Changes to these terms",
        body: [
          "We may update these terms. The date of the current version is at the top of the page and, for important changes, we will give notice on the site before they apply. Continuing to use Orbi after that means you accept the new version.",
        ],
      },
      {
        id: "law",
        title: "Governing law and contact",
        body: ["These terms are governed by the laws of Brazil, and the courts of your place of residence have jurisdiction. Questions, suggestions or complaints: {email}."],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "Cookies are small files a site stores in your browser. Orbi only uses cookies and local storage needed to work and remember your choices. We don't use advertising, tracking or analytics cookies, so we don't ask for consent.",
    sections: [
      {
        id: "cookies",
        title: "Cookies we use",
        body: [],
        items: [
          ["sb-…-auth-token", "Keeps you signed in (Supabase). Lasts until you sign out or the session expires."],
          ["orbi_locale", "Your chosen language. 1 year."],
          ["orbi-device", "Marks this browser as already known, for the \"new device\" warning on your account. 1 year."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Remember which notifications you have seen, marked as read or unread, and deleted. 1 year."],
          ["orbi-welcome-seen", "Remembers that you've already seen Orbi's welcome. 1 year."],
        ],
      },
      {
        id: "storage",
        title: "Local storage",
        body: ["Some settings stay only in your browser and are never sent to us:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "The theme and colors you chose."],
          ["orbi-login", "Your email or username, only if you tick \"Remember me\" when signing in."],
          ["orbi-nav-history", "Pages opened in this tab, so the Back button works. Cleared when you close the tab."],
        ],
      },
      {
        id: "third-party",
        title: "Third-party cookies",
        body: [
          "Orbi doesn't set third-party cookies. If you click to watch a trailer, the video comes from YouTube in privacy-enhanced mode (youtube-nocookie.com), which may store data in your browser under Google's policy. When you sign in with Google, Google's sign-in page uses its own cookies.",
        ],
      },
      {
        id: "control",
        title: "How to control them",
        body: [
          "You can delete or block cookies in your browser settings, but without the session cookie you can't sign in. Signing out deletes the session cookie. Questions: {email}. See also the {privacy}.",
        ],
      },
    ],
  },
};

export default en;
