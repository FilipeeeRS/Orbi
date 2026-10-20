import { notFound } from "next/navigation";
import { getShowByRouteId } from "@/lib/catalog";
import { getDict, getViewer } from "@/lib/session";
import { getItemStats, withSourceStats } from "@/lib/queries";
import { getSeriesEpisodes, getSeriesInfo, tmdbImage, tmdbLanguage } from "@/lib/tmdb";
import { SeriesEpisodes, type SeasonView } from "./series-episodes";
import { Recommendations } from "@/components/recommendations";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { MovieInfo } from "../../movie/[id]/movie-info";
import { EntryEditor } from "../../movie/[id]/entry-editor";
import { TrailerButton } from "../../movie/[id]/trailer-button";
import { ArtEditor } from "../../movie/[id]/art-editor";
import { getArt } from "@/lib/art";
import {
  Certification,
  ExternalLink,
  hoursAndMinutes,
  ItemDetail,
  ItemStats,
  ReviewsSection,
  SignInToLog,
  toView,
} from "@/components/item-detail";

// Página de uma série do TMDB. (Animes têm página própria, com dados do AniList.)
export async function ShowPageContent({ id }: { id: string }) {
  const [item, viewer, { t, locale }] = await Promise.all([getShowByRouteId(id), getViewer(), getDict()]);
  if (!item) notFound();

  const supabase = await createClient();
  const [stats, info, entry, art] = await Promise.all([
    getItemStats(item.id),
    getSeriesInfo(id, tmdbLanguage(locale)),
    viewer
      ? supabase
          .from("entries")
          .select("*")
          .eq("user_id", viewer.id)
          .eq("item_id", item.id)
          .maybeSingle()
          .then((r) => r.data as Entry | null)
      : null,
    // Pôster/fundo que quem está vendo escolheu para esta série
    viewer ? getArt(viewer.id, [item.id]).then((a) => a.get(item.id)) : undefined,
  ]);
  const posterUrl = art?.poster ?? item.poster_url;
  const backdropUrl = art?.backdrop ?? item.backdrop_url;

  const seasons = info ? await getSeasonViews(id, item.id, info.seasons.map((s) => s.number), viewer?.id ?? null, locale) : [];
  const title = itemTitle(item, locale);

  // Números da fonte somados aos do Orbi (TMDB: quem votou conta como quem assistiu); a nota mistura as duas.
  const shown = withSourceStats(stats, item, { watched: item.tmdb_votes ?? 0 });

  return (
    <ItemDetail
      item={item}
      title={title}
      overview={itemOverview(item, locale)}
      posterUrl={posterUrl}
      backdropUrl={backdropUrl}
      hideAdult={!!item.is_adult_rated && !viewer?.show_adult}
      stats={shown}
      t={t}
      editor={
        viewer ? (
          <EntryEditor
            itemId={item.id}
            userId={viewer.id}
            initial={entry}
            series
            progress
          />
        ) : (
          <SignInToLog href={`/series/${id}`} label={t.series.signInToLog} />
        )
      }
      details={
        info && (
          <div className="space-y-4 pt-4">
            <MovieInfo info={toView(info, t, locale, "series")} />
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Certification certifications={info.certifications} locale={locale} label={t.info.ageRating} />
              {info.runtime && (
                <span>
                  {info.runtime} min <span className="text-muted/80">({hoursAndMinutes(info.runtime)})</span>
                </span>
              )}
              {/* Próximo episódio com data marcada (some em série encerrada) */}
              {info.nextAir && (
                <span>
                  {t.series.nextAir(
                    `${t.series.seasonShort}${info.nextAir.season} ${t.series.episodeShort}${info.nextAir.episode}`,
                    airDate(info.nextAir.date, locale),
                  )}
                </span>
              )}
              {/* Sem episódio marcado: a próxima temporada, se já tem data */}
              {!info.nextAir && info.nextSeason && (
                <span>{t.series.nextSeasonOn(info.nextSeason.season, airDate(info.nextSeason.date, locale))}</span>
              )}
              <span>{t.info.moreAt}</span>
              {info.imdbId && <ExternalLink href={`https://www.imdb.com/title/${info.imdbId}/`}>IMDb</ExternalLink>}
              <ExternalLink href={`https://www.themoviedb.org/tv/${item.external_id}`}>TMDB</ExternalLink>
            </p>
          </div>
        )
      }
      side={
        <>
          <ItemStats stats={shown} t={t} locale={locale} />
          {/* Trailer numa linha própria, à direita, embaixo dos números */}
          {info?.trailer && (
            <div className="flex justify-end">
              <TrailerButton videoId={info.trailer} label={t.movie.trailer} />
            </div>
          )}
          {/* Trocar pôster/fundo: só em séries que a pessoa já viu (igual aos filmes) */}
          {viewer && entry?.status === "watched" && (
            <div className="-mt-1 flex justify-end">
              <ArtEditor
                itemId={item.id}
                currentPoster={posterUrl}
                currentBackdrop={backdropUrl}
                labels={{
                  edit: t.movie.artEdit,
                  poster: t.movie.artPoster,
                  backdrop: t.movie.artBackdrop,
                  reset: t.movie.artReset,
                  empty: t.movie.artEmpty,
                  hint: t.movie.artHint,
                }}
              />
            </div>
          )}
        </>
      }
    >
      <SeriesEpisodes showId={Number(id)} seriesItemId={item.id} userId={viewer?.id ?? null} seasons={seasons} />
      <ReviewsSection itemId={item.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
      <Recommendations type="tv" tmdbId={id} language={tmdbLanguage(locale)} viewer={viewer} t={t} />
    </ItemDetail>
  );
}

// Temporadas com episódios (TMDB) e o que a pessoa já marcou em cada uma.
async function getSeasonViews(
  showId: string,
  seriesItemId: string,
  numbers: number[],
  viewerId: string | null,
  locale: keyof typeof dictionaries,
): Promise<SeasonView[]> {
  const supabase = await createClient();
  const [tmdb, seasonItems] = await Promise.all([
    getSeriesEpisodes(showId, numbers, tmdbLanguage(locale)),
    supabase
      .from("items")
      .select("id, season_number")
      .eq("parent_id", seriesItemId)
      .then((r) => (r.data ?? []) as { id: string; season_number: number }[]),
  ]);
  const itemBySeason = new Map(seasonItems.map((s) => [s.season_number, s.id]));
  const ids = seasonItems.map((s) => s.id);

  const watched = new Map<string, number[]>();
  const seasonWatched = new Set<string>();
  if (viewerId && ids.length) {
    const [episodes, entries] = await Promise.all([
      supabase.from("episode_watches").select("item_id, episode_number").eq("user_id", viewerId).in("item_id", ids),
      supabase.from("entries").select("item_id").eq("user_id", viewerId).eq("status", "watched").in("item_id", ids),
    ]);
    for (const e of episodes.data ?? []) watched.set(e.item_id, [...(watched.get(e.item_id) ?? []), e.episode_number]);
    for (const e of entries.data ?? []) seasonWatched.add(e.item_id);
  }

  const lang = dictionaries[locale].htmlLang;
  const today = new Date().toISOString().slice(0, 10);
  const date = (iso: string | null) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang, { day: "2-digit", month: "short", year: "numeric" });
  };

  // Especiais (temporada 0) por último.
  return tmdb
    .filter((s) => s.episodes.length)
    .sort((a, b) => (a.season || 1e6) - (b.season || 1e6))
    .map((s) => {
      const itemId = itemBySeason.get(s.season) ?? null;
      return {
        number: s.season,
        name: s.name,
        itemId,
        watched: itemId ? (watched.get(itemId) ?? []) : [],
        seasonWatched: !!itemId && seasonWatched.has(itemId),
        episodes: s.episodes.map((e) => ({
          number: e.episode_number,
          name: e.name,
          overview: e.overview,
          date: date(e.air_date),
          aired: !!e.air_date && e.air_date <= today,
          runtime: e.runtime,
          still: tmdbImage(e.still_path, "w342"),
          rating: e.rating,
        })),
      };
    });
}

// "2026-10-24" → "24 de out." no idioma da pessoa (com o ano só quando não é o atual).
function airDate(iso: string, locale: keyof typeof dictionaries) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(dictionaries[locale].htmlLang, {
    day: "numeric",
    month: "short",
    ...(y !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}
