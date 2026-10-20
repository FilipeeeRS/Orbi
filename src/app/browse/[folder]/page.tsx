import { Suspense } from "react";
import { notFound } from "next/navigation";
import Loading from "../../loading";
import { FilterBar } from "@/components/filter-bar";
import { FolderIcon } from "@/components/folder-icon";
import { Pagination } from "@/components/pagination";
import { ExternalPosters, type ExternalPoster } from "@/components/external-posters";
import { BROWSE_PAGE_SIZE, BROWSE_SORTS, browseMovies, type BrowseSort } from "@/lib/browse";
import { browseCatalog, CATALOG_GENRES } from "@/lib/anime-db";
import { browseBooks } from "@/lib/openlibrary";
import { browseGames, GAME_GENRES } from "@/lib/steam";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { sortOptions } from "@/lib/sort-options";
import { getDict, getViewer } from "@/lib/session";
import { getMovieGenres, releaseYear, tmdbImage, tmdbLanguage } from "@/lib/tmdb";
import type { MediaKind } from "@/lib/types";

// "Ver tudo" da Home: /browse/movies, /browse/series (TMDB), /browse/anime e /browse/manga (AniList)...
const SLUGS: Record<string, MediaKind> = {
  movies: "movie",
  series: "series",
  anime: "anime",
  manga: "manga",
  music: "music",
  games: "game",
  books: "book",
};
// "Ver tudo" abre em Popularidade · De todos os tempos; a fileira de populares da Home manda sort=week.
const BOOK_SUBJECTS = [
  "Fiction", "Fantasy", "Science fiction", "Romance", "Mystery", "Thriller", "Horror", "Historical fiction",
  "Young adult fiction", "Children's fiction", "Biography", "History", "Philosophy", "Poetry", "Comics & graphic novels",
];
const DEFAULT_SORT: BrowseSort = "popular";

export default function BrowsePage(props: PageProps<"/browse/[folder]">) {
  return (
    <Suspense fallback={<Loading />}>
      <BrowseContent {...props} />
    </Suspense>
  );
}

async function BrowseContent({ params, searchParams }: PageProps<"/browse/[folder]">) {
  const [{ folder }, query] = await Promise.all([params, searchParams]);
  const kind = SLUGS[folder];
  if (!kind) notFound();

  const sort: BrowseSort = BROWSE_SORTS.includes(query.sort as BrowseSort) ? (query.sort as BrowseSort) : DEFAULT_SORT;
  const page = Math.max(1, Number(query.page) || 1);
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  const language = tmdbLanguage(locale);
  const decade = Number(query.decade) || undefined;
  const q = typeof query.q === "string" ? query.q : undefined;

  // Filmes e séries vêm do TMDB, animes e mangás do AniList; as outras pastas entram quando tiverem fonte de dados.
  let list: ExternalPoster[] = [];
  let total = 0;
  let genres: { value: string; label: string }[] = [];
  const browsable = kind !== "music";
  if (kind === "book") {
    const subject = typeof query.genre === "string" ? query.genre : undefined;
    const found = await browseBooks({ page, perPage: BROWSE_PAGE_SIZE, sort, q, decade, subject });
    // Assuntos mais comuns da Open Library (e o que veio da ficha, se não estiver na lista)
    genres = [...new Set([...BOOK_SUBJECTS, ...(subject ? [subject] : [])])].map((g) => ({ value: g, label: g }));
    list = found.list.map((b) => ({ id: b.id, title: b.title, year: b.year, poster: b.cover, rating: b.rating }));
    total = found.total;
  } else if (kind === "game") {
    // Jogos: a busca da loja da Steam (o catálogo inteiro, com paginação e ordenação).
    const found = await browseGames({
      page,
      perPage: BROWSE_PAGE_SIZE,
      sort,
      q,
      developer: typeof query.developer === "string" ? query.developer : undefined,
      publisher: typeof query.publisher === "string" ? query.publisher : undefined,
      // Gênero do filtro (tag da loja) ou vindo da ficha de um jogo
      tag: Number(query.genre) || Number(query.tag) || undefined,
      os: typeof query.os === "string" ? query.os : undefined,
    });
    list = found.list;
    total = found.total;
    genres = GAME_GENRES.map((g) => ({ value: String(g.tag), label: g.name }));
  } else if (kind === "anime" || kind === "manga") {
    const found = await browseCatalog({
      kind,
      page,
      perPage: BROWSE_PAGE_SIZE,
      sort,
      q,
      genre: typeof query.genre === "string" ? query.genre : undefined,
      decade,
      showAdult: !!viewer?.show_adult,
    });
    list = found.list;
    total = found.total;
    genres = CATALOG_GENRES.map((g) => ({ value: g, label: g }));
  } else if (kind === "movie" || kind === "series") {
    const type = kind === "series" ? "tv" : "movie";
    const [found, tmdbGenres] = await Promise.all([
      browseMovies({ decade, genre: Number(query.genre) || undefined, q }, sort, page, {
        language,
        showAdult: !!viewer?.show_adult,
        type,
      }),
      getMovieGenres(language, type),
    ]);
    list = found.movies.map((m) => ({ id: m.id, title: m.title, year: releaseYear(m), poster: tmdbImage(m.poster_path, "w342"), rating: m.vote_average ? m.vote_average / 2 : null, unreleased: !!m.release_date && m.release_date > new Date().toISOString().slice(0, 10) }));
    total = found.total;
    genres = tmdbGenres.map((g) => ({ value: String(g.id), label: g.name }));
  }

  const pages = Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE));
  const count = new Intl.NumberFormat(dictionaries[locale].htmlLang).format(total);

  // Links de página mantêm filtros e ordenação.
  const pageHref = (n: number) => {
    const s = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (typeof value === "string" && key !== "page") s.set(key, value);
    if (n > 1) s.set("page", String(n));
    return s.size ? `/browse/${folder}?${s}` : `/browse/${folder}`;
  };

  return (
    <div className="space-y-6">
      {/* Título e filtros na mesma linha, como nas pastas do perfil */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <h1 className="font-display flex items-center gap-2 pb-2 text-2xl font-extrabold">
          <FolderIcon kind={kind} className="size-6 text-accent" />
          {t.folders.allOf(t.folders[kind])}
          {/* Filtro vindo da ficha de um jogo (desenvolvedora, distribuidora, gênero, plataforma) */}
          {typeof query.label === "string" && <span className="font-sans text-base font-semibold text-accent">· {query.label}</span>}
          <span className="font-sans text-sm font-normal text-muted">{count}</span>
        </h1>
        {browsable && (
          <FilterBar
            labels={t.movies.filters}
            defaultSort={DEFAULT_SORT}
            sorts={sortOptions(BROWSE_SORTS, t)}
            decades={Array.from({ length: 13 }, (_, i) => 2020 - i * 10).map((d) => ({ value: String(d), label: `${d}s` }))}
            genres={genres}
            ratings={[]}
          />
        )}
      </div>

      {list.length && browsable ? (
        <ExternalPosters kind={kind as "movie" | "series" | "anime" | "manga" | "book" | "game"} list={list} viewer={viewer} eager={8} />
      ) : (
        <p className="text-sm text-muted">{t.profile.empty}</p>
      )}

      <Pagination page={page} pages={pages} hrefFor={pageHref} t={t} />
    </div>
  );
}
