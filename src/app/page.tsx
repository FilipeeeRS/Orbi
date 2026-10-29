import { Suspense } from "react";
import Loading from "./loading";
import Link from "next/link";
import { HomeDashboard } from "./home-dashboard";
import { getDict, getViewer } from "@/lib/session";
import { SearchSuggest } from "@/components/search-suggest";
import { FolderIcon } from "@/components/folder-icon";
import { MEDIA_KINDS } from "@/lib/types";
import { tmdbImage, tmdbLanguage, tmdbTrendingWeek } from "@/lib/tmdb";

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent {...props} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: PageProps<"/">) {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  // Logado: a tela inicial vira a Home com amigos e populares da semana.
  if (viewer) return <HomeDashboard viewer={viewer} t={t} locale={locale} folder={(await searchParams).folder} />;

  return (
    <div className="space-y-16 pb-8">
      {/* Mosaico de pôsteres em alta atrás do título (aparece quando chegar; o texto não espera) */}
      <section className="relative -mt-6 ml-[calc(50%-min(50vw,650px))] w-[min(100vw,1300px)] overflow-hidden sm:-mt-8">
        <Suspense fallback={null}>
          <PosterMosaic language={tmdbLanguage(locale)} />
        </Suspense>
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <p className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-xs font-semibold tracking-widest text-accent uppercase backdrop-blur">
            {t.home.tagline}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{t.home.title}</h1>
          <p className="max-w-2xl text-balance text-muted">{t.home.subtitle}</p>
          {/* Busca em destaque no meio da página inicial, com sugestões */}
          <SearchSuggest placeholder={t.nav.search} size="lg" className="w-full max-w-lg" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-fg hover:opacity-90">
              {t.home.cta}
            </Link>
            <Link href="/home" className="rounded-full border border-border bg-bg/60 px-6 py-2.5 font-semibold backdrop-blur hover:border-fg">
              {t.home.explore}
            </Link>
          </div>
          {/* As pastas do Orbi */}
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted">
            {MEDIA_KINDS.map((kind) => (
              <li key={kind} className="flex items-center gap-1.5">
                <FolderIcon kind={kind} className="size-4 text-accent" />
                {t.folders[kind]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* O que dá para fazer no Orbi */}
      <section className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.landing.features.map((f, i) => (
          <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
            <span className="mb-3 grid size-10 place-items-center rounded-full bg-accent/15 text-accent">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={FEATURE_ICONS[i]} />
              </svg>
            </span>
            <h2 className="font-display text-lg font-extrabold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// Ícones dos recursos: registrar (✓ estrela), listas, amigos, o que vem aí (calendário).
const FEATURE_ICONS = [
  "M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z",
  "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
];

// Pôsteres em alta (filmes e séries) em grade, apagados atrás do título.
async function PosterMosaic({ language }: { language: string }) {
  const [movies, shows] = await Promise.all([tmdbTrendingWeek(1, language, "movie"), tmdbTrendingWeek(1, language, "tv")]);
  const posters = [...movies.results, ...shows.results]
    .map((m) => tmdbImage(m.poster_path, "w185"))
    .filter((p): p is string => !!p)
    .slice(0, 32);
  if (!posters.length) return null;
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="grid grid-cols-4 gap-2 opacity-25 sm:grid-cols-8">
        {posters.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- decoração (CDN do TMDB)
          <img key={i} src={src} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-md object-cover" />
        ))}
      </div>
      {/* Esmaece para a cor do fundo, para o texto ficar legível */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/85 to-bg" />
    </div>
  );
}
