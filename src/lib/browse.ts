import "server-only";
import { adultMovieIds } from "./catalog";
import { isAnime, searchMoviesPages, tmdbDiscover, tmdbTrendingWeek, releaseYear, type TmdbMovie, type TmdbType } from "./tmdb";

// "Ver tudo" da Home: qualquer filme ou série que existe, direto do TMDB (não só o catálogo do Orbi).

export const BROWSE_SORTS = ["week", "popular", "top", "top-asc", "release", "release-old", "title", "title-desc"] as const;
export type BrowseSort = (typeof BROWSE_SORTS)[number];

export type BrowseFilters = { decade?: number; genre?: number; q?: string };

export const BROWSE_PAGE_SIZE = 40; // 2 páginas do TMDB por página do Orbi
const TMDB_MAX_PAGES = 500; // limite da própria API

const DISCOVER_SORT: Record<Exclude<BrowseSort, "week">, string> = {
  popular: "popularity.desc",
  top: "vote_average.desc",
  "top-asc": "vote_average.asc",
  release: "primary_release_date.desc",
  "release-old": "primary_release_date.asc",
  title: "title.asc",
  "title-desc": "title.desc",
};

export async function browseMovies(
  filters: BrowseFilters,
  sort: BrowseSort,
  page: number,
  opts: { language: string; showAdult: boolean; type?: TmdbType },
): Promise<{ movies: TmdbMovie[]; total: number }> {
  const type = opts.type ?? "movie";
  // Séries usam "first_air_date" e "name" onde filmes usam "primary_release_date" e "title".
  const date = type === "tv" ? "first_air_date" : "primary_release_date";
  const tmdbSort = (key: Exclude<BrowseSort, "week">) =>
    type === "tv" ? DISCOVER_SORT[key].replace("primary_release_date", "first_air_date").replace("title", "name") : DISCOVER_SORT[key];
  let movies: TmdbMovie[];
  let total: number;

  if (filters.q?.trim()) {
    // Lupa: busca por título no TMDB; década e gênero filtram o resultado.
    const found = await searchMoviesPages(filters.q.trim(), opts.language, 5, type);
    const matched = found
      .filter((m) => !filters.decade || inDecade(m, filters.decade))
      .filter((m) => !filters.genre || (m.genre_ids ?? []).includes(filters.genre));
    const sorted = sortLocally(matched, sort);
    total = sorted.length;
    movies = sorted.slice((page - 1) * BROWSE_PAGE_SIZE, page * BROWSE_PAGE_SIZE);
  } else {
    const tmdbPages = [page * 2 - 1, page * 2].filter((p) => p <= TMDB_MAX_PAGES);
    // "Em alta na semana" só existe sem filtros; com década/gênero usa a popularidade atual.
    const useTrending = sort === "week" && !filters.decade && !filters.genre;
    const results = await Promise.all(
      tmdbPages.map((p) =>
        useTrending
          ? tmdbTrendingWeek(p, opts.language, type)
          : tmdbDiscover(
              {
                sort_by: tmdbSort(sort === "week" ? "popular" : sort),
                with_genres: filters.genre,
                [`${date}.gte`]: filters.decade ? `${filters.decade}-01-01` : undefined,
                [`${date}.lte`]: filters.decade
                  ? `${filters.decade + 9}-12-31`
                  : sort === "release"
                    ? new Date().toISOString().slice(0, 10)
                    : undefined,
                // Sem um mínimo de votos, "mais bem avaliados" fica cheio de filmes com 1 voto 10/10.
                "vote_count.gte": sort === "top" || sort === "top-asc" ? 300 : undefined,
              },
              p,
              opts.language,
              type,
            ),
      ),
    );
    // Páginas vizinhas do TMDB às vezes repetem um título (a ordem muda entre as chamadas).
    const seen = new Set<number>();
    movies = results.flatMap((r) => r.results).filter((m) => !seen.has(m.id) && seen.add(m.id));
    total = Math.min(results[0]?.total_results ?? 0, TMDB_MAX_PAGES * 20);
  }

  // Animes ficam na pasta própria (AniList), fora das séries.
  if (type === "tv") movies = movies.filter((m) => !isAnime(m));
  // Séries +18 já ficam de fora pelo include_adult=false do TMDB.
  if (!opts.showAdult && type === "movie") {
    const adult = await adultMovieIds(movies.map((m) => m.id));
    movies = movies.filter((m) => !adult.has(m.id));
  }
  return { movies, total };
}

function inDecade(m: TmdbMovie, decade: number) {
  const year = releaseYear(m) ?? 0;
  return year >= decade && year < decade + 10;
}

function sortLocally(list: TmdbMovie[], sort: BrowseSort) {
  const by = [...list];
  switch (sort) {
    case "top":
      return by.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    case "top-asc":
      return by.sort((a, b) => (a.vote_average ?? 0) - (b.vote_average ?? 0));
    case "release":
      return by.sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
    case "release-old":
      return by.sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999"));
    case "title":
      return by.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return by.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return by.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
}
