import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieByRouteId } from "@/lib/catalog";
import { getDict, getViewer } from "@/lib/session";
import { getItemStats } from "@/lib/queries";
import { getMovieInfo, tmdbLanguage } from "@/lib/tmdb";
import { MovieInfo } from "./movie-info";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { EntryEditor } from "./entry-editor";
import { TrailerButton } from "./trailer-button";
import { ArtEditor } from "./art-editor";
import { getArt } from "@/lib/art";
import { Recommendations } from "@/components/recommendations";
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

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const item = await getMovieByRouteId((await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

export default function MoviePage(props: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <MoviePageContent {...props} />
    </Suspense>
  );
}

async function MoviePageContent({ params }: PageProps<"/movie/[id]">) {
  const { id } = await params;
  const [item, viewer, { t, locale }] = await Promise.all([getMovieByRouteId(id), getViewer(), getDict()]);
  if (!item) notFound();

  const supabase = await createClient();
  const [stats, info, entry, art] = await Promise.all([
    getItemStats(item.id),
    item.source === "tmdb" && item.external_id ? getMovieInfo(item.external_id, tmdbLanguage(locale)) : null,
    viewer
      ? supabase
          .from("entries")
          .select("*")
          .eq("user_id", viewer.id)
          .eq("item_id", item.id)
          .maybeSingle()
          .then((r) => r.data as Entry | null)
      : null,
    // Pôster/fundo que quem está vendo escolheu para este filme
    viewer ? getArt(viewer.id, [item.id]).then((a) => a.get(item.id)) : undefined,
  ]);
  const posterUrl = art?.poster ?? item.poster_url;
  const backdropUrl = art?.backdrop ?? item.backdrop_url;
  const title = itemTitle(item, locale);

  return (
    <ItemDetail
      item={item}
      title={title}
      overview={itemOverview(item, locale)}
      posterUrl={posterUrl}
      backdropUrl={backdropUrl}
      // Filme 18 anos para quem não ativou o conteúdo +18: imagens borradas e aviso.
      hideAdult={!!item.is_adult_rated && !viewer?.show_adult}
      stats={stats}
      t={t}
      editor={
        viewer ? (
          <EntryEditor itemId={item.id} userId={viewer.id} initial={entry} />
        ) : (
          <SignInToLog href={`/movie/${id}`} label={t.movie.signInToLog} />
        )
      }
      details={
        info && (
          <div className="space-y-4 pt-4">
            <MovieInfo info={toView(info, t, locale)} />
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Certification certifications={info.certifications ?? {}} locale={locale} label={t.info.ageRating} />
              {info.runtime && (
                <span>
                  {info.runtime} min <span className="text-muted/80">({hoursAndMinutes(info.runtime)})</span>
                </span>
              )}
              <span>{t.info.moreAt}</span>
              {info.imdbId && <ExternalLink href={`https://www.imdb.com/title/${info.imdbId}/`}>IMDb</ExternalLink>}
              <ExternalLink href={`https://www.themoviedb.org/movie/${item.external_id}`}>TMDB</ExternalLink>
            </p>
          </div>
        )
      }
      side={
        <>
          <div className="flex items-center justify-between gap-3">
            <ItemStats stats={stats} t={t} locale={locale} />
            {info?.trailer && <TrailerButton videoId={info.trailer} label={t.movie.trailer} />}
          </div>
          {/* Trocar pôster/fundo: só em filmes que a pessoa já viu */}
          {viewer && item.source === "tmdb" && entry?.status === "watched" && (
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
      <ReviewsSection itemId={item.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
      {item.source === "tmdb" && item.external_id && (
        <Recommendations type="movie" tmdbId={item.external_id} language={tmdbLanguage(locale)} viewer={viewer} t={t} />
      )}
    </ItemDetail>
  );
}
