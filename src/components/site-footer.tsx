import Link from "next/link";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const GITHUB_URL = "https://github.com/FilipeeeRS/Orbi-list-everything";

// Redes do Orbi (os perfis @orbi podem ainda não existir; os links já ficam prontos).
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
  {
    name: "Instagram",
    href: "https://www.instagram.com/orbi",
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.3" />
        <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@orbi",
    icon: (
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z"
      />
    ),
  },
  {
    name: "X",
    href: "https://x.com/orbi",
    icon: (
      <path
        fill="currentColor"
        d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58l11.09 14.47Z"
      />
    ),
  },
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
            <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-fg hover:underline">
              {t.footer.tmdb}
            </a>
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
