import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Loading from "../loading";
import { PosterGrid, PosterImage } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { type Sort } from "@/lib/queries";
import { sortOptions } from "@/lib/sort-options";
import { FilterBar } from "@/components/filter-bar";
import { ExternalPosters } from "@/components/external-posters";
import { searchCatalog } from "@/lib/anime-db";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { adultMovieIds } from "@/lib/catalog";
import {
  discoverMovies,
  getPersonMovies,
  releaseYear,
  getMovieGenres,
  isAnime,
  searchMoviesPages,
  tmdbImage,
  tmdbLanguage,
} from "@/lib/tmdb";

export const metadata: Metadata = { title: "Busca" };

const SEARCH_TABS = ["movie", "series", "anime", "manga"] as const;
type SearchTab = (typeof SEARCH_TABS)[number];

// Ordenações possíveis com o que a busca do TMDB devolve (não há duração nem nota sua aqui).
const SEARCH_SORTS = ["popular", "release", "release-old", "top", "title", "title-desc"] as const satisfies readonly Sort[];
type SearchSort = (typeof SEARCH_SORTS)[number];

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults {...props} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = String(params.q ?? "").trim().slice(0, 200);
  const { t, locale } = await getDict();
  const language = tmdbLanguage(locale);

  // Filmes, séries (TMDB), animes ou mangás (AniList), nas abas do topo; a ficha de uma série já manda type=series.
  const series = params.type === "series";
  const type = series ? "tv" : "movie";
  const tab: SearchTab =
    params.type === "anime" ? "anime" : params.type === "manga" ? "manga" : series ? "series" : "movie";
  if (tab === "anime" || tab === "manga") return <CatalogResults q={q} kind={tab} />;

  // Vindo da ficha: obras de uma pessoa, de um gênero, estúdio, emissora ou país.
  const person = Number(params.person) || null;
  const genre = Number(params.genre) || undefined;
  const company = Number(params.company) || undefined;
  const network = series ? Number(params.network) || undefined : undefined;
  const country = typeof params.country === "string" && /^[A-Z]{2}$/.test(params.country) ? params.country : undefined;
  const browsing = !!(person || genre || company || network || country);

  if (!q && !browsing) return <p className="text-muted">{t.search.prompt}</p>;

  const [found, viewer] = await Promise.all([
    person
      ? getPersonMovies(person, language, type)
      : browsing
        ? discoverMovies({ genre, company, network, country }, language, type)
        : searchMoviesPages(q, language, 3, type),
    getViewer(),
  ]);
  // Sem a opção +18 ativada (ou sem login), filmes com classificação 18 anos ficam de fora
  // (séries +18 o próprio TMDB já tira com include_adult=false).
  const adult = viewer?.show_adult || series ? null : await adultMovieIds(found.map((m) => m.id));
  // Animes ficam na aba própria.
  const allowed = found.filter((m) => !adult?.has(m.id) && !(series && isAnime(m)));

  // Filtros e ordenação da busca (mesma barra das pastas, sem nota e sem lupa).
  const sort = SEARCH_SORTS.includes(params.sort as SearchSort) ? (params.sort as SearchSort) : "popular";
  const decade = Number(params.decade) || null;
  const genreFilter = Number(params.genre) || null;
  // Lupa: filtra pelo título dentro dos resultados (ex.: "ocean" nos filmes do Brad Pitt).
  const within = typeof params.in === "string" ? params.in.trim().toLocaleLowerCase() : "";
  const yearOf = (m: (typeof found)[number]) => releaseYear(m) ?? 0;
  const results = allowed
    .filter((m) => !decade || (yearOf(m) >= decade && yearOf(m) < decade + 10))
    .filter(
      (m) =>
        !within ||
        m.title.toLocaleLowerCase().includes(within) ||
        m.original_title.toLocaleLowerCase().includes(within),
    )
    .filter((m) => !genreFilter || (m.genre_ids ?? m.genres?.map((g) => g.id) ?? []).includes(genreFilter))
    .sort((a, b) => {
      switch (sort) {
        case "release":
          return (b.release_date ?? "").localeCompare(a.release_date ?? "");
        case "release-old":
          return (a.release_date || "9999").localeCompare(b.release_date || "9999");
        case "top":
          return (b.vote_average ?? 0) - (a.vote_average ?? 0);
        case "title":
          return a.title.localeCompare(b.title, locale);
        case "title-desc":
          return b.title.localeCompare(a.title, locale);
        default:
          return (b.popularity ?? 0) - (a.popularity ?? 0);
      }
    });
  const genres = await getMovieGenres(language, type);
  // Abas Filmes / Séries mantêm o que foi buscado (texto ou pessoa, gênero...).
  const tabHref = (to: SearchTab) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (typeof value === "string" && !["type", "sort", "decade", "genre", "in", "network"].includes(key)) next.set(key, value);
    if (params.genre && !person && !company && !country) next.delete("q"); // gênero de filme não vale para série
    if (to !== "movie") next.set("type", to);
    return `/search?${next}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <h1 className="pb-2 text-xl font-semibold">{t.search.title(q)}</h1>
          <SearchTabs current={tab} hrefFor={tabHref} t={t} />
        </div>
        <FilterBar
          labels={t.movies.filters}
          defaultSort="popular"
          searchParam="in"
          sorts={sortOptions(SEARCH_SORTS, t)}
          decades={Array.from({ length: 13 }, (_, i) => 2020 - i * 10).map((d) => ({ value: String(d), label: `${d}s` }))}
          genres={genres.map((g) => ({ value: String(g.id), label: g.name }))}
          ratings={[]}
        />
      </div>
      {results.length ? (
        <PosterGrid>
          {results.map((m, i) => {
            const year = releaseYear(m);
            return (
              <Link key={m.id} href={`/${tab}/${m.id}`} className="group block">
                <PosterImage url={tmdbImage(m.poster_path, "w342")} title={m.title} eager={i < 8} />
                <p className="mt-1 line-clamp-2 text-xs">
                  {m.title} {year && <span className="text-muted">{year}</span>}
                </p>
              </Link>
            );
          })}
        </PosterGrid>
      ) : (
        <p className="text-muted">{t.search.empty}</p>
      )}
      {!browsing && !series && (
        <Link href={`/movie/new?title=${encodeURIComponent(q)}`} className="inline-block text-sm text-accent hover:underline">
          {t.manual.link}
        </Link>
      )}
    </div>
  );
}

function SearchTabs({
  current,
  hrefFor,
  t,
}: {
  current: SearchTab;
  hrefFor: (to: SearchTab) => string;
  t: Dictionary;
}) {
  return (
    <nav className="flex gap-4 text-sm">
      {SEARCH_TABS.map((to) => (
        <Link
          key={to}
          href={hrefFor(to)}
          className={`-mb-px border-b-2 pb-2 font-semibold ${
            to === current ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {t.folders[to]}
        </Link>
      ))}
    </nav>
  );
}

// Abas Animes e Mangás: busca no catálogo do AniList (cada temporada aparece separada, como no MyAnimeList),
// tolerante a erro de digitação quando a cópia já está no banco.
async function CatalogResults({ q, kind }: { q: string; kind: "anime" | "manga" }) {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const hrefFor = (to: SearchTab) => `/search?${new URLSearchParams({ q, ...(to === "movie" ? {} : { type: to }) })}`;
  const list = q ? await searchCatalog(q, kind, 50, !!viewer?.show_adult) : [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-border">
        <h1 className="pb-2 text-xl font-semibold">{t.search.title(q)}</h1>
        <SearchTabs current={kind} hrefFor={hrefFor} t={t} />
      </div>
      {list.length ? (
        <ExternalPosters kind={kind} list={list} viewer={viewer} eager={8} />
      ) : (
        <p className="text-muted">{q ? t.search.empty : t.search.prompt}</p>
      )}
    </div>
  );
}
