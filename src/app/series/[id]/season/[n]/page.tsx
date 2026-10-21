import { Suspense } from "react";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeasonByRoute } from "@/lib/catalog";
import { getDict, getViewer } from "@/lib/session";
import { getItemStats } from "@/lib/queries";
import { getSeasonEpisodes, tmdbImage, tmdbLanguage } from "@/lib/tmdb";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { EntryEditor } from "../../../../movie/[id]/entry-editor";
import { ItemDetail, ItemStats, ReviewsSection, SignInToLog } from "@/components/item-detail";
import { EpisodeList } from "./episode-list";

export async function generateMetadata({ params }: PageProps<"/series/[id]/season/[n]">): Promise<Metadata> {
  const { id, n } = await params;
  const found = await getSeasonByRoute(id, n);
  return { title: found ? found.season.title : undefined };
}

export default function SeasonPage(props: PageProps<"/series/[id]/season/[n]">) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <SeasonPageContent {...props} />
    </Suspense>
  );
}

async function SeasonPageContent({ params }: PageProps<"/series/[id]/season/[n]">) {
  const { id, n } = await params;
  const [found, viewer, { t, locale }] = await Promise.all([getSeasonByRoute(id, n), getViewer(), getDict()]);
  if (!found) notFound();
  const { series, season } = found;
  const number = Number(n);

  const supabase = await createClient();
  const [stats, tmdb, entry, watched] = await Promise.all([
    getItemStats(season.id),
    getSeasonEpisodes(id, number, tmdbLanguage(locale)),
    viewer
      ? supabase
          .from("entries")
          .select("*")
          .eq("user_id", viewer.id)
          .eq("item_id", season.id)
          .maybeSingle()
          .then((r) => r.data as Entry | null)
      : null,
    viewer
      ? supabase
          .from("episode_watches")
          .select("episode_number")
          .eq("user_id", viewer.id)
          .eq("item_id", season.id)
          .then((r) => (r.data ?? []).map((w) => w.episode_number as number))
      : [],
  ]);

  const seriesTitle = itemTitle(series, locale);
  const seasonName = number === 0 ? t.series.specials : tmdb?.name || t.series.season(number);
  const lang = dictionaries[locale].htmlLang;
  const date = (iso: string | null) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang, { day: "2-digit", month: "short", year: "numeric" });
  };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ItemDetail
      item={season}
      title={seasonName}
      overview={tmdb?.overview || itemOverview(season, locale)}
      posterUrl={season.poster_url}
      backdropUrl={season.backdrop_url}
      hideAdult={!!season.is_adult_rated && !viewer?.show_adult}
      stats={stats}
      t={t}
      above={
        <Link href={`/series/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
          <svg viewBox="0 0 24 24" className="size-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {seriesTitle}
        </Link>
      }
      editor={
        viewer ? (
          <EntryEditor itemId={season.id} userId={viewer.id} initial={entry} series />
        ) : (
          <SignInToLog href={`/series/${id}/season/${n}`} label={t.series.signInToLog} />
        )
      }
      side={<ItemStats stats={stats} t={t} locale={locale} />}
    >
      {tmdb && tmdb.episodes.length > 0 && (
        <EpisodeList
          seasonItemId={season.id}
          seriesItemId={series.id}
          tmdb={{ show: Number(id), season: number }}
          userId={viewer?.id ?? null}
          seasonWatched={entry?.status === "watched"}
          initialWatched={watched}
          episodes={tmdb.episodes.map((e) => ({
            number: e.episode_number,
            name: e.name,
            overview: e.overview,
            date: date(e.air_date),
            aired: !!e.air_date && e.air_date <= today,
            runtime: e.runtime,
            still: tmdbImage(e.still_path, "w342"),
          }))}
        />
      )}
      <ReviewsSection itemId={season.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
    </ItemDetail>
  );
}
