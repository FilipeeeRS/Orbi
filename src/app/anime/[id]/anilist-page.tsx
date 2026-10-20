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

// Página de anime (uma temporada) ou de mangá, com dados do AniList: a mesma das séries, com os
// relacionados (temporada anterior, sequência, mangá original, adaptações...) no lugar dos episódios.
export async function AniListPageContent({ id, kind }: { id: string; kind: "anime" | "manga" }) {
  const [item, viewer, { t, locale }] = await Promise.all([getAniListByRouteId(kind, id), getViewer(), getDict()]);
  if (!item) notFound();
  const manga = kind === "manga";

  const supabase = await createClient();
  const [stats, media, entry] = await Promise.all([
    getItemStats(item.id),
    getAnime(Number(id), manga ? "MANGA" : "ANIME"),
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

  // Relacionados em duas fileiras: animes e mangás (sem clipes musicais), na ordem anterior → sequência → resto.
  const ORDER = [
    "PREQUEL", "SEQUEL", "PARENT", "SOURCE", "ADAPTATION", "SIDE_STORY", "SPIN_OFF",
    "ALTERNATIVE", "SUMMARY", "COMPILATION", "CHARACTER", "OTHER",
  ];
  const relatedOf = (type: "ANIME" | "MANGA"): ExternalPoster[] =>
    (media?.relations.edges ?? [])
      .filter((e) => e.node.type === type && e.node.format !== "MUSIC" && ORDER.includes(e.relationType))
      .filter((e) => !e.node.isAdult || !!viewer?.show_adult)
      .sort((a, b) => ORDER.indexOf(a.relationType) - ORDER.indexOf(b.relationType))
      .map((e) => ({
        id: e.node.id,
        title: animeTitle(e.node),
        year: animeYear(e.node),
        poster: animeCover(e.node),
        label: t.anime.relations[e.relationType] ?? e.relationType,
      }));
  const relatedAnime = relatedOf("ANIME");
  const relatedManga = relatedOf("MANGA");
  const recommended: ExternalPoster[] = (media?.recommendations.nodes ?? [])
    .map((n) => n.mediaRecommendation)
    .filter((m): m is NonNullable<typeof m> => !!m && (!m.isAdult || !!viewer?.show_adult))
    .slice(0, 6)
    .map((m) => ({ id: m.id, title: animeTitle(m), year: animeYear(m), poster: animeCover(m) }));

  // Anime que já terminou: a próxima temporada anunciada (sequência ainda não lançada), se houver.
  const sequel =
    !manga && !media?.nextAiringEpisode
      ? media?.relations.edges.find(
          (e) => e.relationType === "SEQUEL" && e.node.type === "ANIME" && e.node.status === "NOT_YET_RELEASED",
        )?.node
      : undefined;
  const sequelWhen = sequel ? whenLabel(sequel, t, locale) : null;

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
          <EntryEditor itemId={item.id} userId={viewer.id} initial={entry} series progress={manga ? "chapter" : "episode"} />
        ) : (
          <SignInToLog href={`/${kind}/${id}`} label={manga ? t.manga.signInToLog : t.anime.signInToLog} />
        )
      }
      details={
        media && (
          <div className="space-y-4 pt-4">
            <MovieInfo info={aniListView(media, t)} />
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {manga ? (
                <>
                  {media.chapters && <span>{t.manga.chapters(media.chapters)}</span>}
                  {media.volumes && <span>{t.manga.volumes(media.volumes)}</span>}
                </>
              ) : (
                <>
                  {media.episodes && <span>{t.series.episodeCount(media.episodes)}</span>}
                  {media.duration && <span>{t.anime.perEpisode(media.duration)}</span>}
                </>
              )}
              {/* Em exibição: o próximo episódio. Terminado: a próxima temporada, se já foi anunciada. */}
              {media.nextAiringEpisode ? (
                <span>
                  {t.series.nextAir(
                    `${t.series.episodeShort}${media.nextAiringEpisode.episode}`,
                    dateLabel(new Date(media.nextAiringEpisode.airingAt * 1000), locale),
                  )}
                </span>
              ) : (
                sequel && (
                  <span>
                    {sequelWhen ? t.anime.nextSeasonOn(animeTitle(sequel), sequelWhen) : t.anime.nextSeasonTba(animeTitle(sequel))}
                  </span>
                )
              )}
              <span>{t.info.moreAt}</span>
              {media.idMal && (
                <ExternalLink href={`https://myanimelist.net/${kind}/${media.idMal}`}>MyAnimeList</ExternalLink>
              )}
              <ExternalLink href={`https://anilist.co/${kind}/${id}`}>AniList</ExternalLink>
            </p>
          </div>
        )
      }
      side={
        <div className="flex items-center justify-between gap-3">
          <ItemStats stats={stats} t={t} locale={locale} />
          {media?.trailer?.site === "youtube" && <TrailerButton videoId={media.trailer.id} label={t.movie.trailer} />}
        </div>
      }
    >
      {(relatedAnime.length > 0 || relatedManga.length > 0) && (
        <PosterSection title={t.anime.related}>
          {/* A fileira do próprio tipo primeiro (no anime, as temporadas; no mangá, os volumes/spin-offs) */}
          <div className="space-y-6">
            {(manga ? (["manga", "anime"] as const) : (["anime", "manga"] as const)).map((k) => {
              const list = k === "anime" ? relatedAnime : relatedManga;
              if (!list.length) return null;
              return (
                <div key={k} className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted">{t.folders[k]}</h3>
                  <ExternalPosters kind={k} list={list} viewer={viewer} />
                </div>
              );
            })}
          </div>
        </PosterSection>
      )}
      <ReviewsSection itemId={item.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
      {recommended.length > 0 && (
        <PosterSection title={t.movie.recommendations}>
          <ExternalPosters kind={kind} list={recommended} viewer={viewer} layout="row" />
        </PosterSection>
      )}
    </ItemDetail>
  );
}

// Função na equipe do AniList → grupo da ficha (os mesmos da ficha dos filmes).
// No mangá, "Story & Art", "Story" e "Art" são os autores (obra original).
function staffRole(role: string): CrewRole | null {
  const r = role.replace(/\s*\(.*\)$/, "");
  if (r === "Director") return "director";
  if (["Original Creator", "Original Story", "Story & Art", "Story", "Art"].includes(r)) return "original";
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
    .map((w) => (w.length <= 3 && w !== "web" && w !== "one" ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

// Ficha no mesmo formato da dos filmes/séries: personagens (com a dublagem japonesa no tooltip),
// equipe, detalhes (estúdio, formato, origem, temporada, situação, onde ler/assistir) e gêneros.
function aniListView(media: AnimeMedia, t: Dictionary): MovieInfoView {
  const crew = new Map<CrewRole, { name: string }[]>();
  for (const s of media.staff.edges) {
    const role = staffRole(s.role);
    if (!role) continue;
    const list = crew.get(role) ?? [];
    if (!list.some((p) => p.name === s.node.name.full)) list.push({ name: s.node.name.full });
    crew.set(role, list);
  }
  const season = media.season && media.seasonYear ? `${t.anime.seasons[media.season]} ${media.seasonYear}` : null;
  const links = media.externalLinks.filter((l) => l.type === "STREAMING");
  const format = media.format === "MOVIE" ? t.search.typeMovie : media.format ? pretty(media.format) : null;
  const base = media.type === "MANGA" ? "/browse/manga" : "/browse/anime";

  return {
    cast: media.characters.edges.map((c) => ({
      name: c.node.name.full,
      character: c.voiceActors[0]?.name.full ?? "",
    })),
    crew: (["original", "director", "writers", "producers", "music", "cinematography"] as const)
      .filter((role) => crew.get(role)?.length)
      .map((role) => ({ role, people: crew.get(role)! })),
    details: [
      { label: t.info.studios, values: media.studios.nodes.map((s) => ({ name: s.name })) },
      { label: t.anime.format, values: format ? [{ name: format }] : [] },
      { label: t.anime.source, values: media.source ? [{ name: pretty(media.source) }] : [] },
      {
        label: t.anime.season,
        values:
          season && media.season && media.seasonYear
            ? [{ name: season, href: `/anime/season?year=${media.seasonYear}&season=${media.season.toLowerCase()}` }]
            : [],
      },
      { label: t.anime.status, values: media.status ? [{ name: t.anime.statuses[media.status] ?? pretty(media.status) }] : [] },
      { label: t.info.watch, values: links.map((l) => ({ name: l.site, href: l.url })) },
    ].filter((row) => row.values.length),
    genres: media.genres.map((g) => ({ name: g, href: `${base}?genre=${encodeURIComponent(g)}` })),
    releases: [],
    watch: null,
  };
}

// "24 de out." no idioma da pessoa (com o ano só quando não é o atual).
function dateLabel(date: Date, locale: keyof typeof dictionaries) {
  return date.toLocaleDateString(dictionaries[locale].htmlLang, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

// Quando sai a próxima temporada: a data exata, senão a temporada ("Inverno 2027"), senão o ano.
function whenLabel(a: Pick<AnimeMedia, "startDate" | "season" | "seasonYear">, t: Dictionary, locale: keyof typeof dictionaries) {
  const { year, month, day } = a.startDate;
  if (year && month && day) return dateLabel(new Date(year, month - 1, day), locale);
  if (a.season && a.seasonYear) return `${t.anime.seasons[a.season]} ${a.seasonYear}`;
  return year ? String(year) : null;
}
