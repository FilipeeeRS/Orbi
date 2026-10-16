import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Loading from "../loading";
import { PosterGrid, PosterImage } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { SORT_LABEL, type Sort } from "@/lib/queries";
import { FilterBar } from "@/components/filter-bar";
import { adultMovieIds } from "@/lib/catalog";
import {
  discoverMovies,
  getPersonMovies,
  releaseYear,
  getMovieGenres,
  searchMoviesPages,
  tmdbImage,
  tmdbLanguage,
} from "@/lib/tmdb";

export const metadata: Metadata = { title: "Busca" };

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

  // Vindo da ficha de um filme: filmes de uma pessoa, de um gênero, estúdio ou país.
  const person = Number(params.person) || null;
  const genre = Number(params.genre) || undefined;
  const company = Number(params.company) || undefined;
  const country = typeof params.country === "string" && /^[A-Z]{2}$/.test(params.country) ? params.country : undefined;
  const browsing = !!(person || genre || company || country);

  if (!q && !browsing) return <p className="text-muted">{t.search.prompt}</p>;

  const [found, viewer] = await Promise.all([
    person
      ? getPersonMovies(person, language)
      : browsing
        ? discoverMovies({ genre, company, country }, language)
        : searchMoviesPages(q, language),
    getViewer(),
  ]);
  // Sem a opção +18 ativada (ou sem login), filmes com classificação 18 anos ficam de fora.
  const adult = viewer?.show_adult ? null : await adultMovieIds(found.map((m) => m.id));
  const allowed = adult ? found.filter((m) => !adult.has(m.id)) : found;

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
  const genres = await getMovieGenres(language);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <h1 className="pb-2 text-xl font-semibold">{t.search.title(q)}</h1>
        <FilterBar
          labels={t.movies.filters}
          defaultSort="popular"
          searchParam="in"
          sorts={SEARCH_SORTS.map((key) => ({ value: key, label: t.movies.sort[SORT_LABEL[key]] }))}
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
              <Link key={m.id} href={`/movie/${m.id}`} className="group block">
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
      {!browsing && (
        <Link href={`/movie/new?title=${encodeURIComponent(q)}`} className="inline-block text-sm text-accent hover:underline">
          {t.manual.link}
        </Link>
      )}
    </div>
  );
}
