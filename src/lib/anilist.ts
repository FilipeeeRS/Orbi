import "server-only";
import { cacheLife } from "next/cache";

// AniList (graphql.anilist.co): fonte dos animes. Cada temporada é um anime próprio, ligado às outras
// por prequel/sequel, como no MyAnimeList (o id do MAL vem junto). Não precisa de chave; o limite é
// de ~30 requisições por minuto, então tudo passa por cache.

const API = "https://graphql.anilist.co";

export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export const ANIME_SEASONS: AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

type FuzzyDate = { year: number | null; month: number | null; day: number | null };

export type AnimeCard = {
  id: number;
  title: { romaji: string | null; english: string | null; native: string | null };
  format: string | null; // TV, MOVIE, OVA, ONA, SPECIAL...
  episodes: number | null;
  season: AnimeSeason | null;
  seasonYear: number | null;
  startDate: FuzzyDate;
  averageScore: number | null; // 0..100
  popularity: number | null;
  genres: string[];
  isAdult: boolean;
  coverImage: { extraLarge: string | null; large: string | null };
};

export type AnimeMedia = AnimeCard & {
  idMal: number | null;
  favourites: number | null;
  stats: { statusDistribution: { status: string; amount: number }[] } | null;
  type: "ANIME" | "MANGA";
  chapters: number | null;
  volumes: number | null;
  updatedAt: number | null;
  description: string | null;
  bannerImage: string | null;
  duration: number | null; // minutos por episódio
  status: string | null; // FINISHED, RELEASING, NOT_YET_RELEASED...
  source: string | null; // MANGA, LIGHT_NOVEL, ORIGINAL...
  endDate: FuzzyDate;
  synonyms: string[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  trailer: { id: string; site: string } | null;
  studios: { nodes: { id: number; name: string }[] };
  externalLinks: { site: string; url: string; type: string }[];
  relations: { edges: { relationType: string; node: AnimeCard & { type: string; status: string | null } }[] };
  characters: {
    edges: { role: string; node: { name: { full: string } }; voiceActors: { name: { full: string } }[] }[];
  };
  staff: { edges: { role: string; node: { name: { full: string } } }[] };
  recommendations: { nodes: { mediaRecommendation: AnimeCard | null }[] };
};

const CARD = `id title { romaji english native } format episodes season seasonYear startDate { year month day }
  averageScore popularity genres isAdult coverImage { extraLarge large }`;

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    // Limite de requisições: espera o tempo pedido (no máximo 2 tentativas).
    if (res.status === 429 && attempt < 2) {
      const wait = Number(res.headers.get("retry-after")) || 2;
      await new Promise((r) => setTimeout(r, Math.min(wait, 10) * 1000));
      continue;
    }
    const json = (await res.json()) as { data?: T; errors?: { message: string; status?: number }[] };
    if (json.errors?.some((e) => e.status === 404)) throw new AnimeNotFound();
    if (!res.ok || !json.data) throw new Error(`AniList ${res.status}: ${json.errors?.[0]?.message ?? ""}`);
    return json.data;
  }
}

export class AnimeNotFound extends Error {}

// Ficha completa de um anime (uma temporada) ou de um mangá.
export async function getAnime(id: number, type: "ANIME" | "MANGA" = "ANIME"): Promise<AnimeMedia | null> {
  "use cache";
  cacheLife("days");
  try {
    const data = await anilist<{ Media: AnimeMedia }>(
      `query ($id: Int, $type: MediaType) { Media(id: $id, type: $type) {
        ${CARD} idMal type chapters volumes updatedAt description(asHtml: false) bannerImage duration status source synonyms
        favourites stats { statusDistribution { status amount } }
        endDate { year month day }
        nextAiringEpisode { episode airingAt }
        trailer { id site }
        studios(isMain: true) { nodes { id name } }
        externalLinks { site url type }
        relations { edges { relationType node { ${CARD} type status } } }
        characters(sort: [ROLE, RELEVANCE], perPage: 40) { edges { role node { name { full } } voiceActors(language: JAPANESE) { name { full } } } }
        staff(sort: [RELEVANCE], perPage: 25) { edges { role node { name { full } } } }
        recommendations(sort: [RATING_DESC], perPage: 12) { nodes { mediaRecommendation { ${CARD} } } }
      } }`,
      { id, type },
    );
    return data.Media;
  } catch (e) {
    if (e instanceof AnimeNotFound) return null;
    throw e;
  }
}

export type AnimeSort = "TRENDING_DESC" | "POPULARITY_DESC" | "SCORE_DESC" | "START_DATE_DESC" | "START_DATE" | "TITLE_ROMAJI" | "TITLE_ROMAJI_DESC";

export type AnimeQuery = {
  type?: "ANIME" | "MANGA"; // padrão: anime
  page: number;
  perPage: number;
  sort: AnimeSort;
  search?: string;
  genre?: string;
  season?: AnimeSeason;
  seasonYear?: number;
  decade?: number; // 1990 = anos 90
  showAdult?: boolean;
};

// Listagens (Ver tudo, temporada, busca): uma página de animes (ou mangás) do AniList.
// Falha (ex.: limite de requisições) vira lista vazia, mas só respostas de verdade vão para o cache.
export async function browseAnime(q: AnimeQuery): Promise<{ list: AnimeCard[]; total: number; hasNext: boolean }> {
  try {
    return await fetchAnimePage(q);
  } catch {
    return { list: [], total: 0, hasNext: false };
  }
}

async function fetchAnimePage(q: AnimeQuery): Promise<{ list: AnimeCard[]; total: number; hasNext: boolean }> {
  "use cache";
  cacheLife("hours");
  {
    const data = await anilist<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AnimeCard[] } }>(
      `query ($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $genre: String, $season: MediaSeason,
              $seasonYear: Int, $from: FuzzyDateInt, $to: FuzzyDateInt, $isAdult: Boolean, $type: MediaType) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total hasNextPage }
          media(type: $type, sort: $sort, search: $search, genre: $genre, season: $season, seasonYear: $seasonYear,
                startDate_greater: $from, startDate_lesser: $to, isAdult: $isAdult) { ${CARD} }
        }
      }`,
      {
        type: q.type ?? "ANIME",
        page: q.page,
        perPage: q.perPage,
        // Na busca por texto, a relevância vem antes da ordenação escolhida.
        sort: q.search ? ["SEARCH_MATCH", q.sort] : [q.sort],
        search: q.search || undefined,
        genre: q.genre || undefined,
        season: q.season,
        seasonYear: q.seasonYear,
        from: q.decade ? q.decade * 10000 : undefined,
        to: q.decade ? (q.decade + 10) * 10000 : undefined,
        isAdult: q.showAdult ? undefined : false,
      },
    );
    // Clipes musicais ficam de fora (o filtro format_not_in do AniList zera a lista).
    const list = data.Page.media.filter((m) => m.format !== "MUSIC");
    return { list, total: data.Page.pageInfo.total, hasNext: data.Page.pageInfo.hasNextPage };
  }
}

// Os ~500 animes mais populares, para a busca achar o título mesmo com erro de digitação
// ("atack on titan"), já que a busca do AniList não tolera erro. Montado uma vez por semana.
export async function getPopularAnimeIndex(): Promise<AnimeCard[]> {
  try {
    return await buildPopularAnimeIndex();
  } catch {
    return [];
  }
}

// Só um índice completo vai para o cache: se uma página falhar, tenta de novo na próxima vez.
async function buildPopularAnimeIndex(): Promise<AnimeCard[]> {
  "use cache";
  cacheLife("weeks");
  const pages = [];
  // Uma página por vez: o AniList aceita poucas requisições por minuto.
  for (let page = 1; page <= 10; page++) {
    const { list, hasNext } = await fetchAnimePage({ page, perPage: 50, sort: "POPULARITY_DESC" });
    pages.push(...list);
    if (!hasNext) break;
  }
  return pages;
}

// Gêneros do AniList (filtro das listagens de anime). Falha não vai para o cache.
export async function getAnimeGenres(): Promise<string[]> {
  try {
    return await fetchGenres();
  } catch {
    return [];
  }
}

async function fetchGenres(): Promise<string[]> {
  "use cache";
  cacheLife("weeks");
  return (await anilist<{ GenreCollection: string[] }>("query { GenreCollection }", {})).GenreCollection.filter(
    (g) => g !== "Hentai",
  );
}

// Temporada de anime em que uma data cai (inverno = jan–mar, primavera = abr–jun...).
export function seasonOf(date = new Date()): { season: AnimeSeason; year: number } {
  return { season: ANIME_SEASONS[Math.floor(date.getMonth() / 3)], year: date.getFullYear() };
}

export function shiftSeason(s: { season: AnimeSeason; year: number }, by: number) {
  const index = s.year * 4 + ANIME_SEASONS.indexOf(s.season) + by;
  return { season: ANIME_SEASONS[((index % 4) + 4) % 4], year: Math.floor(index / 4) };
}

// Título para mostrar: o inglês quando existe, senão o romaji (como o MyAnimeList em inglês).
export const animeTitle = (a: Pick<AnimeCard, "title">) => a.title.english || a.title.romaji || a.title.native || "";

export const animeYear = (a: Pick<AnimeCard, "seasonYear" | "startDate">) => a.seasonYear ?? a.startDate.year ?? null;

export const animeCover = (a: Pick<AnimeCard, "coverImage">) => a.coverImage.extraLarge ?? a.coverImage.large;

// Descrição do AniList vem com <br>, <i>... e "(Source: ...)": vira texto simples.
export function plainDescription(text: string | null) {
  if (!text) return null;
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\(Source:[^)]*\)\s*$/i, "")
    .trim();
}

const pad = (n: number | null) => String(n ?? 1).padStart(2, "0");
export const fuzzyToIso = (d: FuzzyDate) => (d.year ? `${d.year}-${pad(d.month)}-${pad(d.day)}` : null);
