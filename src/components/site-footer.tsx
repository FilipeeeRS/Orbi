import Link from "next/link";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { fill } from "@/lib/i18n/fill";

export const GITHUB_URL = "https://github.com/FilipeeeRS/Orbi";
// Canal para pedidos de privacidade, direitos autorais e contato em geral
// (aparece no rodapé e nas páginas de Privacidade, Termos e Cookies).
export const CONTACT_EMAIL = "contato@example.com";

// Redes do Orbi: só as que existem de verdade.
const SOCIAL = [
  {
    name: "GitHub",
    href: GITHUB_URL,
    icon: (
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
      />
    ),
  },
];

// De onde vêm os dados e as imagens das obras (aparecem nos créditos).
export const SOURCES = [
  { key: "tmdb", name: "TMDB", href: "https://www.themoviedb.org" },
  { key: "anilist", name: "AniList", href: "https://anilist.co" },
  { key: "openlibrary", name: "Open Library", href: "https://openlibrary.org" },
  { key: "steam", name: "Steam", href: "https://store.steampowered.com" },
];

// Rodapé: colunas com as páginas do site e as redes; embaixo, créditos, idioma e tema.
// Sem login, os links da conta levam para o login (e voltam para a página escolhida).
export function SiteFooter({ t, username }: { t: Dictionary; username: string | null }) {
  const account = (href: string) => (username ? href : `/login?next=${encodeURIComponent(href)}`);
  const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      title: t.footer.explore,
      links: [
        { label: t.nav.home, href: "/home" },
        { label: t.folders.movie, href: "/browse/movies" },
        { label: t.folders.series, href: "/browse/series" },
        { label: t.folders.book, href: "/browse/books" },
        { label: t.folders.anime, href: "/browse/anime" },
        { label: t.folders.manga, href: "/browse/manga" },
        { label: t.folders.game, href: "/browse/games" },
        { label: t.lists.allTitle, href: "/lists" },
        { label: t.footer.search, href: "/search" },
      ],
    },
    {
      title: t.footer.account,
      links: [
        username ? { label: t.nav.profile, href: `/u/${username}` } : { label: t.nav.signIn, href: "/login" },
        { label: t.nav.notifications, href: account("/notifications") },
        { label: t.nav.import, href: account("/import") },
        { label: t.nav.settings, href: account("/settings") },
      ],
    },
    {
      title: "Orbi",
      links: [
        { label: t.footer.about, href: "/about" },
        { label: t.legal.privacy, href: "/privacy" },
        { label: t.legal.terms, href: "/terms" },
        { label: t.legal.cookies, href: "/cookies" },
        { label: t.legal.contact, href: `mailto:${CONTACT_EMAIL}`, external: true },
        { label: t.footer.sourceCode, href: GITHUB_URL, external: true },
      ],
    },
  ];

  return (
    <footer className="mt-8 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-8">
          <div className="grid flex-1 grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 sm:max-w-2xl">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="mb-3 text-xs font-semibold tracking-widest text-muted uppercase">{col.title}</h2>
                <ul className="space-y-2 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="text-fg/80 hover:text-fg">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-fg/80 hover:text-fg">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <ul className="flex items-start gap-4">
            {SOCIAL.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="block text-muted transition hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                    {s.icon}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted">
          <p className="max-w-xl">
            © {new Date().getFullYear()} Orbi.{" "}
            {/* Créditos das fontes dos dados e das imagens das obras */}
            {fill(t.footer.sources, Object.fromEntries(SOURCES.map((s) => [s.key, (
              <a key={s.key} href={s.href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
                {s.name}
              </a>
            )])))}{" "}
            {t.footer.tmdb}
          </p>
          <div className="flex items-center gap-2">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
