import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAniListByRouteId } from "@/lib/catalog";
import { getDict, getViewer } from "@/lib/session";
import { getItemStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";
import { animeCover, animeTitle, animeYear, getAnime, type AnimeMedia } from "@/lib/anilist";
import type { CrewRole } from "@/lib/tmdb";
import { MovieInfo, type MovieInfoView } from "../../movie/[id]/movie-info";
import { EntryEditor } from "../../movie/[id]/entry-editor";
import { TrailerButton } from "../../movie/[id]/trailer-button";
import { ExternalLink, ItemDetail, ItemStats, ReviewsSection, SignInToLog } from "@/components/item-detail";
import { ExternalPosters, type ExternalPoster } from "@/components/external-posters";
import { PosterSection } from "@/components/recommendations";

export async function generateMetadata({ params }: PageProps<"/anime/[id]">): Promise<Metadata> {
  const item = await getAniListByRouteId("anime", (await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

// Anime (uma temporada, com dados do AniList): mesma página das séries, com os relacionados
// (temporada anterior, sequência, filmes...) no lugar da lista de episódios.
export default function AnimePage(props: PageProps<"/anime/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <AnimePageContent {...props} />
    </Suspense>
  );
}

async function AnimePageContent({ params }: PageProps<"/anime/[id]">) {
  const { id } = await params;
  const [item, viewer, { t, locale }] = await Promise.all([getAniListByRouteId("anime", id), getViewer(), getDict()]);
  if (!item) notFound();

  const supabase = await createClient();
  const [stats, anime, entry] = await Promise.all([
    getItemStats(item.id),
    getAnime(Number(id)),
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

  // Relacionados: só animes (sem mangá e sem clipes musicais), na ordem anterior → sequência → resto.
  const ORDER = ["PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "SPIN_OFF", "ALTERNATIVE", "SUMMARY", "COMPILATION", "CHARACTER", "OTHER"];
  const related: ExternalPoster[] = (anime?.relations.edges ?? [])
    .filter((e) => e.node.type === "ANIME" && e.node.format !== "MUSIC" && ORDER.includes(e.relationType))
    .sort((a, b) => ORDER.indexOf(a.relationType) - ORDER.indexOf(b.relationType))
    .map((e) => ({
      id: e.node.id,
      title: animeTitle(e.node),
      year: animeYear(e.node),
      poster: animeCover(e.node),
      label: t.anime.relations[e.relationType] ?? e.relationType,
    }));
  const recommended: ExternalPoster[] = (anime?.recommendations.nodes ?? [])
    .map((n) => n.mediaRecommendation)
    .filter((m): m is NonNullable<typeof m> => !!m && (!m.isAdult || !!viewer?.show_adult))
    .slice(0, 6)
    .map((m) => ({ id: m.id, title: animeTitle(m), year: animeYear(m), poster: animeCover(m) }));

  return (
    <ItemDetail
      item={item}
      title={itemTitle(item, locale)}
      overview={itemOverview(item, locale)}
      posterUrl={item.poster_url}
      backdropUrl={item.backdrop_url}
      hideAdult={!!item.is_adult_rated && !viewer?.show_adult}
      stats={stats}
      t={t}
      editor={
        viewer ? (
          <EntryEditor itemId={item.id} userId={viewer.id} initial={entry} series progress="episode" />
        ) : (
          <SignInToLog href={`/anime/${id}`} label={t.anime.signInToLog} />
        )
      }
      details={
        anime && (
          <div className="space-y-4 pt-4">
            <MovieInfo info={animeView(anime, t)} />
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {anime.episodes && <span>{t.series.episodeCount(anime.episodes)}</span>}
              {anime.duration && <span>{t.anime.perEpisode(anime.duration)}</span>}
              {/* Próximo episódio com data marcada (some quando o anime terminou) */}
              {anime.nextAiringEpisode && (
                <span>
                  {t.series.nextAir(
                    `${t.series.episodeShort}${anime.nextAiringEpisode.episode}`,
                    airDate(anime.nextAiringEpisode.airingAt, locale),
                  )}
                </span>
              )}
              <span>{t.info.moreAt}</span>
              {anime.idMal && <ExternalLink href={`https://myanimelist.net/anime/${anime.idMal}`}>MyAnimeList</ExternalLink>}
              <ExternalLink href={`https://anilist.co/anime/${id}`}>AniList</ExternalLink>
            </p>
          </div>
        )
      }
      side={
        <div className="flex items-center justify-between gap-3">
          <ItemStats stats={stats} t={t} locale={locale} />
          {anime?.trailer?.site === "youtube" && <TrailerButton videoId={anime.trailer.id} label={t.movie.trailer} />}
        </div>
      }
    >
      {related.length > 0 && (
        <PosterSection title={t.anime.related}>
          <ExternalPosters kind="anime" list={related} viewer={viewer} />
        </PosterSection>
      )}
      <ReviewsSection itemId={item.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
      {recommended.length > 0 && (
        <PosterSection title={t.movie.recommendations}>
          <ExternalPosters kind="anime" list={recommended} viewer={viewer} layout="row" />
        </PosterSection>
      )}
    </ItemDetail>
  );
}

// Função na equipe do AniList → grupo da ficha (os mesmos da ficha dos filmes).
function staffRole(role: string): CrewRole | null {
  const r = role.replace(/\s*\(.*\)$/, "");
  if (r === "Director") return "director";
  if (r === "Original Creator" || r === "Original Story") return "original";
  if (r === "Series Composition" || r === "Script" || r === "Screenplay") return "writers";
  if (r === "Music") return "music";
  if (r === "Producer") return "producers";
  if (r === "Director of Photography") return "cinematography";
  return null;
}

// "LIGHT_NOVEL" → "Light Novel"
const pretty = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((w) => (w.length <= 3 && w !== "web" ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

// Ficha no mesmo formato da dos filmes/séries: personagens (com a dublagem japonesa no tooltip),
// equipe, detalhes (estúdio, formato, origem, temporada, situação, onde assistir) e gêneros.
function animeView(anime: AnimeMedia, t: Dictionary): MovieInfoView {
  const crew = new Map<CrewRole, { name: string }[]>();
  for (const s of anime.staff.edges) {
    const role = staffRole(s.role);
    if (!role) continue;
    const list = crew.get(role) ?? [];
    if (!list.some((p) => p.name === s.node.name.full)) list.push({ name: s.node.name.full });
    crew.set(role, list);
  }
  const season =
    anime.season && anime.seasonYear
      ? `${t.anime.seasons[anime.season]} ${anime.seasonYear}`
      : null;
  const streaming = anime.externalLinks.filter((l) => l.type === "STREAMING");
  const format = anime.format === "MOVIE" ? t.search.typeMovie : anime.format ? pretty(anime.format) : null;

  return {
    cast: anime.characters.edges.map((c) => ({
      name: c.node.name.full,
      character: c.voiceActors[0]?.name.full ?? "",
    })),
    crew: (["original", "director", "writers", "producers", "music", "cinematography"] as const)
      .filter((role) => crew.get(role)?.length)
      .map((role) => ({ role, people: crew.get(role)! })),
    details: [
      { label: t.info.studios, values: anime.studios.nodes.map((s) => ({ name: s.name })) },
      { label: t.anime.format, values: format ? [{ name: format }] : [] },
      { label: t.anime.source, values: anime.source ? [{ name: pretty(anime.source) }] : [] },
      {
        label: t.anime.season,
        values: season && anime.season && anime.seasonYear
          ? [{ name: season, href: `/anime/season?year=${anime.seasonYear}&season=${anime.season.toLowerCase()}` }]
          : [],
      },
      { label: t.anime.status, values: anime.status ? [{ name: t.anime.statuses[anime.status] ?? pretty(anime.status) }] : [] },
      { label: t.info.watch, values: streaming.map((l) => ({ name: l.site, href: l.url })) },
    ].filter((row) => row.values.length),
    genres: anime.genres.map((g) => ({ name: g, href: `/browse/anime?genre=${encodeURIComponent(g)}` })),
    releases: [],
    watch: null,
  };
}

// Horário do próximo episódio (timestamp do AniList) → "24 de out." no idioma da pessoa.
function airDate(timestamp: number, locale: keyof typeof dictionaries) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(dictionaries[locale].htmlLang, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}
