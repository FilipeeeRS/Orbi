import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Loading from "../loading";
import { PosterGrid, PosterImage } from "@/components/poster";
import { getDict } from "@/lib/session";
import { releaseYear, searchMovies, tmdbImage, tmdbLanguage } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Busca" };

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults {...props} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: PageProps<"/search">) {
  const q = String((await searchParams).q ?? "").trim().slice(0, 200);
  const { t, locale } = await getDict();

  if (!q) return <p className="text-muted">{t.search.prompt}</p>;

  const results = await searchMovies(q, { language: tmdbLanguage(locale) });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t.search.title(q)}</h1>
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
      <Link href={`/movie/new?title=${encodeURIComponent(q)}`} className="inline-block text-sm text-accent hover:underline">
        {t.manual.link}
      </Link>
    </div>
  );
}
