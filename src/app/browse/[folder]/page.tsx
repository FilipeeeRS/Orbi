import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Loading from "../../loading";
import { FilterBar } from "@/components/filter-bar";
import { FolderIcon } from "@/components/folder-icon";
import { PosterGrid, PosterImage } from "@/components/poster";
import { BROWSE_PAGE_SIZE, BROWSE_SORTS, browseMovies, type BrowseSort } from "@/lib/browse";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { SORT_LABEL } from "@/lib/queries";
import { getDict, getViewer } from "@/lib/session";
import { getMovieGenres, releaseYear, tmdbImage, tmdbLanguage } from "@/lib/tmdb";
import type { MediaKind } from "@/lib/types";

// "Ver tudo" da Home: /browse/movies, /browse/series... com qualquer item que existe no TMDB.
const SLUGS: Record<string, MediaKind> = {
  movies: "movie",
  series: "series",
  music: "music",
  games: "game",
  books: "book",
};
const DEFAULT_SORT: BrowseSort = "week";

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

  // Por enquanto só filmes vêm do TMDB; as outras pastas entram quando tiverem fonte de dados.
  const [{ movies, total }, genres] =
    kind === "movie"
      ? await Promise.all([
          browseMovies(
            {
              decade: Number(query.decade) || undefined,
              genre: Number(query.genre) || undefined,
              q: typeof query.q === "string" ? query.q : undefined,
            },
            sort,
            page,
            { language, showAdult: !!viewer?.show_adult },
          ),
          getMovieGenres(language),
        ])
      : [{ movies: [], total: 0 }, []];
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
          <span className="font-sans text-sm font-normal text-muted">{count}</span>
        </h1>
        {kind === "movie" && (
          <FilterBar
            labels={t.movies.filters}
            defaultSort={DEFAULT_SORT}
            sorts={BROWSE_SORTS.map((key) => ({ value: key, label: t.movies.sort[SORT_LABEL[key]] }))}
            decades={Array.from({ length: 13 }, (_, i) => 2020 - i * 10).map((d) => ({ value: String(d), label: `${d}s` }))}
            genres={genres.map((g) => ({ value: String(g.id), label: g.name }))}
            ratings={[]}
          />
        )}
      </div>

      {movies.length ? (
        <PosterGrid>
          {movies.map((m, i) => {
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
        <p className="text-sm text-muted">{t.profile.empty}</p>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="hover:text-accent">
              ← {t.movies.prev}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">{t.movies.page(page, pages)}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="hover:text-accent">
              {t.movies.next} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
