import "server-only";
import { cache } from "react";
import { createAdminClient } from "./supabase/admin";
import {
  getMovieWithTranslations,
  getSeasonWithTranslations,
  getShowWithTranslations,
  hasAdultRating,
  isAdultRatedMovie,
  releaseYear,
  tmdbImage,
  TmdbNotFound,
  type TmdbTranslation,
} from "./tmdb";
import { LOCALES, TMDB_LANGUAGES } from "./i18n/dictionaries";
import type { Item } from "./types";
import { getAnime } from "./anilist";
import { getBook } from "./openlibrary";
import { getGame } from "./steam";
import { toRow } from "./anilist-sync";

// Garante que o filme do TMDB exista no catálogo (tabela items) e o devolve.
export async function ensureMovie(tmdbId: number): Promise<Item | null> {
  const admin = createAdminClient();
  const externalId = String(tmdbId);

  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("kind", "movie")
    .eq("source", "tmdb")
    .eq("external_id", externalId)
    .maybeSingle();
  // Filmes salvos por versões antigas (só "pt" nas traduções, ou sem nota do TMDB): busca de novo.
  const legacy =
    existing &&
    (Object.keys(existing.translations ?? {}).every((k) => k === "pt") ||
      existing.tmdb_votes === null ||
      existing.is_adult_rated === null);
  if (existing && !legacy) return existing as Item;

  let movie;
  try {
    movie = await getMovieWithTranslations(tmdbId);
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  const { data, error } = await admin
    .from("items")
    .upsert(
      {
        kind: "movie",
        source: "tmdb",
        external_id: externalId,
        title: movie.title,
        original_title: movie.original_title,
        year: releaseYear(movie),
        overview: movie.overview || null,
        poster_url: tmdbImage(movie.poster_path, "w500"),
        backdrop_url: tmdbImage(movie.backdrop_path, "w1280"),
        translations: pickTranslations(movie.translations.translations, movie.title),
        tmdb_rating: movie.vote_count ? Math.round((movie.vote_average ?? 0) * 10) / 10 : null,
        tmdb_votes: movie.vote_count ?? 0,
        is_adult_rated: hasAdultRating(movie.release_dates),
        genre_ids: (movie.genres ?? []).map((g) => g.id),
        runtime: movie.runtime || null,
        release_date: movie.release_date || null,
      },
      { onConflict: "kind,source,external_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as Item;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /movie/603 = filme do TMDB; /movie/<uuid> = filme cadastrado manualmente.
export const getMovieByRouteId = cache(async (id: string): Promise<Item | null> => {
  if (UUID.test(id)) {
    const { data } = await createAdminClient().from("items").select("*").eq("id", id).eq("kind", "movie").maybeSingle();
    return data as Item | null;
  }
  const tmdbId = Number(id);
  return Number.isInteger(tmdbId) && tmdbId > 0 ? ensureMovie(tmdbId) : null;
});

// ---- Séries e temporadas ----

// Garante que a série do TMDB exista no catálogo e a devolve. (Animes vêm do AniList: ensureAnime.)
export async function ensureSeries(tmdbId: number): Promise<Item | null> {
  const admin = createAdminClient();
  const externalId = String(tmdbId);
  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("kind", "series")
    .eq("source", "tmdb")
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing) return existing as Item;

  let show;
  try {
    show = await getShowWithTranslations(tmdbId);
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  const { data, error } = await admin
    .from("items")
    .upsert(
      {
        kind: "series",
        source: "tmdb",
        external_id: externalId,
        title: show.title,
        original_title: show.original_title,
        year: releaseYear(show),
        overview: show.overview || null,
        poster_url: tmdbImage(show.poster_path, "w500"),
        backdrop_url: tmdbImage(show.backdrop_path, "w1280"),
        translations: pickTranslations(show.translations.translations, show.title),
        tmdb_rating: show.vote_count ? Math.round((show.vote_average ?? 0) * 10) / 10 : null,
        tmdb_votes: show.vote_count ?? 0,
        is_adult_rated: !!show.adult,
        genre_ids: (show.genres ?? []).map((g) => g.id),
        runtime: show.episode_run_time?.[0] || null,
        release_date: show.release_date || null,
      },
      { onConflict: "kind,source,external_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as Item;
}

// Temporada como item próprio (external_id "série/número"), presa à série pelo parent_id.
// O título leva o nome da série ("Breaking Bad: Season 2"), em cada idioma.
export async function ensureSeason(showTmdbId: number, seasonNumber: number): Promise<{ series: Item; season: Item } | null> {
  const series = await ensureSeries(showTmdbId);
  if (!series) return null;
  const admin = createAdminClient();
  const externalId = `${showTmdbId}/${seasonNumber}`;
  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("kind", "season")
    .eq("source", "tmdb")
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing) return { series, season: existing as Item };

  let season;
  try {
    season = await getSeasonWithTranslations(showTmdbId, seasonNumber);
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  // Nome da temporada em cada idioma, com o nome da série na frente.
  const seasonNames = pickTranslations(season.translations, season.name);
  const translations: Item["translations"] = {};
  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const showTitle = series.translations?.[locale]?.title ?? series.title;
    const seasonName = seasonNames[locale]?.title ?? season.name;
    const overview = seasonNames[locale]?.overview;
    translations[locale] = { title: `${showTitle}: ${seasonName}`, ...(overview ? { overview } : {}) };
  }

  const { data, error } = await admin
    .from("items")
    .upsert(
      {
        kind: "season",
        source: "tmdb",
        external_id: externalId,
        parent_id: series.id,
        season_number: seasonNumber,
        episode_count: season.episodes?.length ?? null,
        title: `${series.title}: ${season.name}`,
        original_title: null,
        year: season.air_date ? Number(season.air_date.slice(0, 4)) || null : null,
        overview: season.overview || null,
        poster_url: tmdbImage(season.poster_path, "w500") ?? series.poster_url,
        backdrop_url: series.backdrop_url,
        translations,
        is_adult_rated: series.is_adult_rated,
        genre_ids: series.genre_ids,
        runtime: series.runtime,
        release_date: season.air_date || null,
      },
      { onConflict: "kind,source,external_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return { series, season: data as Item };
}

export const getShowByRouteId = cache(async (id: string): Promise<Item | null> => {
  const tmdbId = Number(id);
  return Number.isInteger(tmdbId) && tmdbId > 0 ? ensureSeries(tmdbId) : null;
});

export const getSeasonByRoute = cache(async (id: string, season: string) => {
  const tmdbId = Number(id);
  const n = Number(season);
  return Number.isInteger(tmdbId) && tmdbId > 0 && Number.isInteger(n) && n >= 0 ? ensureSeason(tmdbId, n) : null;
});

// ---- Animes e mangás (AniList) ----

// Garante que o anime (uma temporada) ou o mangá exista no catálogo e o devolve. Normalmente ele já
// veio pela sincronização; se não (ex.: lançou hoje), busca no AniList e salva na hora.
export async function ensureAniList(kind: "anime" | "manga", anilistId: number): Promise<Item | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("kind", kind)
    .eq("source", "anilist")
    .eq("external_id", String(anilistId))
    .maybeSingle();
  if (existing) return existing as Item;

  const media = await getAnime(anilistId, kind === "anime" ? "ANIME" : "MANGA");
  if (!media) return null;
  const row = toRow(media, media.type);
  const upsert = (values: Partial<typeof row>) =>
    admin.from("items").upsert(values, { onConflict: "kind,source,external_id" }).select("*").single();
  let { data, error } = await upsert(row);
  // Banco ainda sem as colunas da cópia do catálogo (migração catalog_mirror): salva só as antigas.
  if (error?.code === "PGRST204") ({ data, error } = await upsert(withoutMirrorColumns(row)));
  if (error) throw error;
  return data as Item;
}

const MIRROR_COLUMNS = ["mal_id", "format", "status", "season", "season_year", "genres", "chapters", "volumes", "source_updated_at"];
const withoutMirrorColumns = <T extends object>(row: T) =>
  Object.fromEntries(Object.entries(row).filter(([key]) => !MIRROR_COLUMNS.includes(key))) as Partial<T>;

export const ensureAnime = (id: number) => ensureAniList("anime", id);
export const ensureManga = (id: number) => ensureAniList("manga", id);

export const getAniListByRouteId = cache(async (kind: "anime" | "manga", id: string): Promise<Item | null> => {
  const anilistId = Number(id);
  return Number.isInteger(anilistId) && anilistId > 0 ? ensureAniList(kind, anilistId) : null;
});

// ---- Livros (Open Library) e jogos (Steam) ----

// Procura no catálogo; se não estiver, monta a linha com `load` e salva.
async function ensureExternal(
  kind: "book" | "game",
  source: string,
  externalId: string,
  load: () => Promise<Record<string, unknown> | null>,
): Promise<Item | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("kind", kind)
    .eq("source", source)
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing) return existing as Item;
  const row = await load();
  if (!row) return null;
  const { data, error } = await admin
    .from("items")
    .upsert({ kind, source, external_id: externalId, genre_ids: [], translations: {}, ...row }, { onConflict: "kind,source,external_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Item;
}

// Livro da Open Library ("OL45804W"). Nota da fonte (0..5) vira 0..10, como as outras.
export const ensureBook = (workId: string) =>
  ensureExternal("book", "openlibrary", workId, async () => {
    const book = await getBook(workId);
    if (!book) return null;
    return {
      title: book.title,
      original_title: book.authors.join(", ") || null, // autores aparecem embaixo do título
      year: book.year,
      overview: book.description,
      poster_url: book.cover,
      backdrop_url: null,
      tmdb_rating: book.rating != null ? Math.round(book.rating * 20) / 10 : null,
      tmdb_votes: book.ratings,
      is_adult_rated: false,
      runtime: book.pages, // páginas (para ordenar por "duração")
      release_date: book.year ? `${book.year}-01-01` : null,
    };
  });

// Jogo da Steam (appid). Nota do Metacritic (0..100) vira 0..10.
export const ensureGame = (appId: number) =>
  ensureExternal("game", "steam", String(appId), async () => {
    const game = await getGame(appId);
    if (!game) return null;
    return {
      title: game.title,
      original_title: null,
      year: game.year,
      overview: game.description,
      poster_url: game.poster,
      backdrop_url: game.header,
      tmdb_rating: game.metacritic != null ? game.metacritic / 10 : null,
      tmdb_votes: game.recommendations,
      is_adult_rated: false,
      runtime: null,
      release_date: null,
    };
  });

export const getBookByRouteId = cache(async (id: string) => (/^OL\d+W$/.test(id) ? ensureBook(id) : null));
export const getGameByRouteId = cache(async (id: string) => {
  const appId = Number(id);
  return Number.isInteger(appId) && appId > 0 ? ensureGame(appId) : null;
});

// Uma tradução por idioma do Orbi, preferindo a região padrão (pt-BR, zh-CN...).
function pickTranslations(list: TmdbTranslation[], englishTitle: string): Item["translations"] {
  const out: Item["translations"] = {};
  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const region = TMDB_LANGUAGES[locale].split("-")[1];
    const candidates = list.filter((t) => t.iso_639_1 === locale);
    const best = candidates.find((t) => t.iso_3166_1 === region) ?? candidates[0];
    const title = best?.data.title?.trim();
    const overview = best?.data.overview?.trim();
    if (!title && !overview) continue;
    out[locale] = {
      ...(title && title !== englishTitle ? { title } : {}),
      ...(overview ? { overview } : {}),
    };
  }
  return out;
}

// Filmes do TMDB com classificação 18 anos, para tirar da busca e do "Ver tudo" de quem não ativou +18.
// Junta o que o catálogo do Orbi já sabe (is_adult_rated) com a checagem no TMDB, para não depender
// só do TMDB responder na hora.
export async function adultMovieIds(tmdbIds: number[]): Promise<Set<number>> {
  if (!tmdbIds.length) return new Set();
  const [known, checks] = await Promise.all([
    createAdminClient()
      .from("items")
      .select("external_id")
      .eq("kind", "movie")
      .eq("source", "tmdb")
      .eq("is_adult_rated", true)
      .in("external_id", tmdbIds.map(String)),
    Promise.all(tmdbIds.map((id) => isAdultRatedMovie(id))),
  ]);
  const adult = new Set((known.data ?? []).map((row) => Number(row.external_id)));
  tmdbIds.forEach((id, i) => checks[i] && adult.add(id));
  return adult;
}
