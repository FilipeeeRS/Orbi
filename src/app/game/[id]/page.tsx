import { Suspense } from "react";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameByRouteId } from "@/lib/catalog";
import { genreTag, getGame, getGameReviews } from "@/lib/steam";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getDict, getViewer } from "@/lib/session";
import { preloadItemStats, getItemStats, withSourceStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { itemTitle, type Entry } from "@/lib/types";
import { MovieInfo } from "../../movie/[id]/movie-info";
import { EntryEditor } from "../../movie/[id]/entry-editor";
import { ExternalLink, ItemDetail, ItemStats, ReviewsSection, SignInToLog } from "@/components/item-detail";

export async function generateMetadata({ params }: PageProps<"/game/[id]">): Promise<Metadata> {
  const item = await getGameByRouteId((await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

// Jogo (dados da loja da Steam): mesma página dos filmes, com desenvolvedora, plataformas e gêneros.
export default function GamePage(props: PageProps<"/game/[id]">) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <GameContent {...props} />
    </Suspense>
  );
}

async function GameContent({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  preloadItemStats(getGameByRouteId(id));
  const [item, viewer, { t, locale }] = await Promise.all([getGameByRouteId(id), getViewer(), getDict()]);
  if (!item) notFound();

  const supabase = await createClient();
  const [stats, game, reviews, entry] = await Promise.all([
    getItemStats(item.id),
    getGame(Number(id), locale),
    getGameReviews(Number(id), locale),
    viewer
      ? supabase
          .from("entries")
          .select("*")
          .eq("user_id", viewer.id)
          .eq("item_id", item.id)
          .maybeSingle()
          .then((r) => r.data as Entry | null)
      : null,
  ]);

  // Números da fonte somados aos do Orbi (Steam: quem avaliou conta como quem jogou); a nota mistura as duas.
  // Nota da fonte = % de avaliações positivas da Steam (positiva = 10, negativa = 0), pesando pelo total de avaliações.
  const shown = withSourceStats(
    stats,
    { tmdb_rating: reviews?.rating ?? item.tmdb_rating, tmdb_votes: reviews?.total ?? item.tmdb_votes },
    { watched: reviews?.total ?? item.tmdb_votes ?? 0 },
  );

  return (
    <ItemDetail
      item={item}
      title={itemTitle(item, locale)}
      // Resumo no idioma da pessoa (a loja traduz), senão o salvo no catálogo.
      overview={game?.description ?? item.overview}
      posterUrl={item.poster_url}
      backdropUrl={game?.header ?? item.backdrop_url}
      hideAdult={false}
      stats={shown}
      t={t}
      sourceLine={
        reviews && (
          <span>
            {reviews.label} · {t.game.reviewsOnSteam(reviews.total.toLocaleString(dictionaries[locale].htmlLang))}
          </span>
        )
      }
      editor={
        viewer ? (
          <EntryEditor itemId={item.id} userId={viewer.id} initial={entry} series verb="play" unreleased={!!game?.comingSoon} />
        ) : (
          <SignInToLog href={`/game/${id}`} label={t.game.signInToLog} />
        )
      }
      details={
        game && (
          <div className="space-y-4 pt-4">
            <MovieInfo
              info={{
                cast: [],
                crew: [],
                // Cada nome abre "Todos os jogos" filtrado por ele.
                details: [
                  {
                    label: t.game.developers,
                    values: game.developers.map((name) => ({ name, href: gamesBy({ developer: name, label: name }) })),
                  },
                  {
                    label: t.game.publishers,
                    values: game.publishers.map((name) => ({ name, href: gamesBy({ publisher: name, label: name }) })),
                  },
                  {
                    label: t.game.platforms,
                    values: game.platforms.map((p) => ({
                      name: p.name,
                      href: gamesBy({ os: p.key === "windows" ? "win" : p.key, label: p.name }),
                    })),
                  },
                ].filter((row) => row.values.length),
                genres: game.genres.map((g) => {
                  const tag = genreTag(g.id);
                  return { name: g.name, href: tag ? gamesBy({ genre: String(tag) }) : undefined };
                }),
                releases: [],
                watch: null,
              }}
            />
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {game.releaseDate && (
                <span>{game.comingSoon ? t.movie.releasesOn(game.releaseDate) : t.game.released(game.releaseDate)}</span>
              )}
              {game.metacritic != null && <span>Metacritic {game.metacritic}</span>}
              <span>{t.info.moreAt}</span>
              <ExternalLink href={`https://store.steampowered.com/app/${id}`}>Steam</ExternalLink>
            </p>
          </div>
        )
      }
      side={<ItemStats stats={shown} t={t} locale={locale} unreleased={!!game?.comingSoon} />}
    >
      <ReviewsSection itemId={item.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
    </ItemDetail>
  );
}

const gamesBy = (params: Record<string, string>) => `/browse/games?${new URLSearchParams(params)}`;
