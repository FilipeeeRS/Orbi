import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import Loading from "../../loading";
import type { Metadata } from "next";
import { FolderIcon } from "@/components/folder-icon";
import { ExternalPosters } from "@/components/external-posters";
import { ANIME_SEASONS, seasonOf, shiftSeason, type AnimeSeason } from "@/lib/anilist";
import { browseCatalog } from "@/lib/anime-db";
import { getDict, getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Anime" };

// Temporada de anime (como a "Seasonal Anime" do MyAnimeList): o que estreou naquela temporada,
// dos mais populares para os menos, com setas para a anterior e a próxima. Sem parâmetros, a atual.
export default function AnimeSeasonPage(props: PageProps<"/anime/season">) {
  return (
    <Suspense fallback={<Loading />}>
      <SeasonContent {...props} />
    </Suspense>
  );
}

async function SeasonContent({ searchParams }: PageProps<"/anime/season">) {
  const [query, viewer, { t }] = await Promise.all([searchParams, getViewer(), getDict()]);
  await connection(); // a temporada atual depende da data de hoje (não pode ir para o pré-render)
  const now = seasonOf();
  const asked = String(query.season ?? "").toUpperCase() as AnimeSeason;
  const current = {
    season: ANIME_SEASONS.includes(asked) ? asked : now.season,
    year: Number(query.year) > 1900 ? Number(query.year) : now.year,
  };

  // Até 100 títulos (2 páginas de 50), o suficiente para uma temporada inteira.
  const pages = await Promise.all(
    [1, 2].map((page) =>
      browseCatalog({
        kind: "anime",
        page,
        perPage: 50,
        sort: "popular",
        season: current.season,
        seasonYear: current.year,
        showAdult: !!viewer?.show_adult,
      }),
    ),
  );
  const seen = new Set<number>();
  const list = pages.flatMap((p) => p.list).filter((a) => !seen.has(a.id) && seen.add(a.id));

  const label = (s: { season: AnimeSeason; year: number }) => `${t.anime.seasons[s.season]} ${s.year}`;
  const href = (s: { season: AnimeSeason; year: number }) => `/anime/season?year=${s.year}&season=${s.season.toLowerCase()}`;
  const prev = shiftSeason(current, -1);
  const next = shiftSeason(current, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2">
        <h1 className="font-display flex items-center gap-2 text-2xl font-extrabold">
          <FolderIcon kind="anime" className="size-6 text-accent" />
          {label(current)}
        </h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={href(prev)} className="text-muted hover:text-fg" title={t.anime.prevSeason}>
            ← {label(prev)}
          </Link>
          <Link href={href(next)} className="text-muted hover:text-fg" title={t.anime.nextSeason}>
            {label(next)} →
          </Link>
        </nav>
      </div>
      {list.length ? (
        <ExternalPosters kind="anime" list={list} viewer={viewer} eager={8} />
      ) : (
        <p className="text-sm text-muted">{t.profile.empty}</p>
      )}
    </div>
  );
}
