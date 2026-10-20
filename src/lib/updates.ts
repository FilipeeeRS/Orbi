// Novidades do Orbi que aparecem nas notificações de todo mundo (mais recentes primeiro).
// Texto em português e inglês; os outros idiomas usam o inglês.
export type AppUpdate = {
  id: string;
  date: string; // AAAA-MM-DD
  title: { pt: string; en: string };
  body: { pt: string; en: string };
};

export const APP_UPDATES: AppUpdate[] = [
  {
    id: "2026-10-21-notifications",
    date: "2026-10-21",
    title: { pt: "Notificações novas", en: "New notifications" },
    body: {
      pt: "Agora você é avisado quando algo da sua watchlist estreia e quando sua conta entra num aparelho novo.",
      en: "You now get notified when something on your watchlist comes out and when your account signs in on a new device.",
    },
  },
  {
    id: "2026-10-20-books-games",
    date: "2026-10-20",
    title: { pt: "Livros, jogos, animes e mangás", en: "Books, games, anime and manga" },
    body: {
      pt: "O Orbi agora tem livros (Open Library), jogos (Steam), animes e mangás (AniList), cada um com a sua pasta.",
      en: "Orbi now has books (Open Library), games (Steam), anime and manga (AniList), each with its own folder.",
    },
  },
];
