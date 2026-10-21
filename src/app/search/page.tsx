import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { GridSkeleton } from "@/components/skeletons";
import { PosterGrid, PosterImage } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { type Sort } from "@/lib/queries";
import { sortOptions } from "@/lib/sort-options";
import { FilterBar } from "@/components/filter-bar";
import { ExternalPosters } from "@/components/external-posters";
import { searchCatalog } from "@/lib/anime-db";
import { animeCover, animeTitle, animeYear, getCharacterWorks, getStaffWorks, getStudioWorks } from "@/lib/anilist";
import { searchBooks } from "@/lib/openlibrary";
import { searchGames } from "@/lib/steam";
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

const SEARCH_TABS = ["all", "movie", "series", "book", "anime", "manga", "game"] as const;
type SearchTab = (typeof SEARCH_TABS)[number];

// Ordenações possíveis com o que a busca do TMDB devolve (não há duração nem nota sua aqui).
const SEARCH_SORTS = ["popular", "release", "release-old", "top", "top-asc", "title", "title-desc"] as const satisfies readonly Sort[];
type SearchSort = (typeof SEARCH_SORTS)[number];

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
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
  // Sem tipo, a busca por texto abre em "Tudo"; vindo da ficha (pessoa, gênero...), em Filmes.
  const fromInfo = ["person", "genre", "company", "network", "country"].some((key) => params[key]);
  const tab: SearchTab =
    params.type === "anime"
      ? "anime"
      : params.type === "manga" || params.type === "book" || params.type === "game"
        ? params.type
        : series
          ? "series"
          : params.type === "movie" || fromInfo
            ? "movie"
            : "all";
  // Vindo da ficha de anime/mangá: obras de uma pessoa, personagem ou estúdio do AniList.
  for (const key of ["anistaff", "anichar", "studio"] as const) {
    const id = Number(params[key]);
    if (id > 0) return <AniListPersonResults q={q} kind={key} id={id} />;
  }
  if (tab === "all") return <AllResults q={q} />;
  if (tab === "anime" || tab === "manga" || tab === "book" || tab === "game") return <CatalogResults q={q} kind={tab} />;

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
        case "top-asc":
          return (a.vote_average ?? 0) - (b.vote_average ?? 0);
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
    if (to !== "all") next.set("type", to);
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
    <nav className="flex max-w-full gap-4 overflow-x-auto text-sm [scrollbar-width:none]">
      {SEARCH_TABS.map((to) => (
        <Link
          key={to}
          href={hrefFor(to)}
          className={`-mb-px border-b-2 pb-2 font-semibold ${
            to === current ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {to === "all" ? t.folders.all : t.folders[to]}
        </Link>
      ))}
    </nav>
  );
}

// Busca de um tipo que não vem do TMDB: animes e mangás (catálogo do AniList), livros (Open Library), jogos (Steam).
async function searchKind(q: string, kind: "anime" | "manga" | "book" | "game", limit: number, showAdult: boolean) {
  if (kind === "book") return (await searchBooks(q, limit)).list.map((b) => ({ id: b.id, title: b.title, year: b.year, poster: b.cover, rating: b.rating }));
  if (kind === "game") return searchGames(q, limit);
  return searchCatalog(q, kind, limit, showAdult);
}

// Abas Livros, Animes, Mangás e Jogos: busca na fonte de cada tipo (cada temporada aparece separada, como no MyAnimeList),
// tolerante a erro de digitação quando a cópia já está no banco.
async function CatalogResults({ q, kind }: { q: string; kind: "anime" | "manga" | "book" | "game" }) {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const hrefFor = (to: SearchTab) => `/search?${new URLSearchParams({ q, ...(to === "all" ? {} : { type: to }) })}`;
  const list = q ? await searchKind(q, kind, 50, !!viewer?.show_adult) : [];
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

// Aba "Tudo": um tópico por tipo (Filmes, Séries, Livros, Animes, Mangás, Jogos) com uma fileira de resultados e
// "Ver mais" para a aba daquele tipo. Tipos sem nenhum resultado não aparecem.
async function AllResults({ q }: { q: string }) {
  const [{ t, locale }, viewer] = await Promise.all([getDict(), getViewer()]);
  const language = tmdbLanguage(locale);
  const hrefFor = (to: SearchTab) => `/search?${new URLSearchParams({ q, ...(to === "all" ? {} : { type: to }) })}`;
  const header = (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-border">
      <h1 className="pb-2 text-xl font-semibold">{t.search.title(q)}</h1>
      <SearchTabs current="all" hrefFor={hrefFor} t={t} />
    </div>
  );
  if (!q) return <div className="space-y-6">{header}<p className="text-muted">{t.search.prompt}</p></div>;

  const showAdult = !!viewer?.show_adult;
  const [movies, shows, books, animes, mangas, games] = await Promise.all([
    searchMoviesPages(q, language, 1, "movie"),
    searchMoviesPages(q, language, 1, "tv"),
    searchKind(q, "book", 6, showAdult),
    searchKind(q, "anime", 6, showAdult),
    searchKind(q, "manga", 6, showAdult),
    searchKind(q, "game", 6, showAdult),
  ]);
  const adult = showAdult ? null : await adultMovieIds(movies.slice(0, 6).map((m) => m.id));
  const card = (m: { id: number; title: string; release_date?: string; poster_path: string | null; vote_average?: number }) => ({
    id: m.id,
    title: m.title,
    year: releaseYear(m),
    poster: tmdbImage(m.poster_path, "w342"),
    rating: m.vote_average ? m.vote_average / 2 : null, unreleased: !!m.release_date && m.release_date > new Date().toISOString().slice(0, 10),
  });
  const groups = [
    { kind: "movie" as const, list: movies.filter((m) => !adult?.has(m.id)).slice(0, 6).map(card) },
    { kind: "series" as const, list: shows.filter((m) => !isAnime(m)).slice(0, 6).map(card) },
    { kind: "book" as const, list: books },
    { kind: "anime" as const, list: animes },
    { kind: "manga" as const, list: mangas },
    { kind: "game" as const, list: games },
  ].filter((g) => g.list.length);

  return (
    <div className="space-y-8">
      {header}
      {groups.length ? (
        groups.map((g) => (
          <section key={g.kind}>
            <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">{t.folders[g.kind]}</h2>
              <Link href={hrefFor(g.kind)} className="text-[11px] tracking-wider text-muted uppercase hover:text-accent">
                {t.search.more}
              </Link>
            </div>
            {/* Mesmo padrão da Home: uma fileira de pôsteres com título e ano embaixo */}
            <ExternalPosters kind={g.kind} list={g.list} viewer={viewer} layout="row" />
          </section>
        ))
      ) : (
        <p className="text-muted">{t.search.empty}</p>
      )}
    </div>
  );
}

// Tudo em que uma pessoa (elenco ou equipe), personagem ou estúdio do AniList aparece, em animes e mangás.
async function AniListPersonResults({ q, kind, id }: { q: string; kind: "anistaff" | "anichar" | "studio"; id: number }) {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const works = await (kind === "anistaff" ? getStaffWorks(id) : kind === "anichar" ? getCharacterWorks(id) : getStudioWorks(id));
  const groups = (["anime", "manga"] as const)
    .map((k) => ({
      kind: k,
      list: works[k]
        .filter((a) => !a.isAdult || !!viewer?.show_adult)
        .map((a) => ({ id: a.id, title: animeTitle(a), year: animeYear(a), poster: animeCover(a), rating: a.averageScore ? a.averageScore / 20 : null, unreleased: a.status === "NOT_YET_RELEASED" })),
    }))
    .filter((g) => g.list.length);
  return (
    <div className="space-y-8">
      <h1 className="border-b border-border pb-2 text-xl font-semibold">{t.search.title(q)}</h1>
      {groups.length ? (
        groups.map((g) => (
          <section key={g.kind}>
            <h2 className="mb-3 border-b border-border pb-2 text-xs font-semibold tracking-widest text-muted uppercase">
              {t.folders[g.kind]}
            </h2>
            <ExternalPosters kind={g.kind} list={g.list} viewer={viewer} eager={8} />
          </section>
        ))
      ) : (
        <p className="text-muted">{t.search.empty}</p>
      )}
    </div>
  );
}
