import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { animeCover, animeTitle, animeYear, browseAnime, type AnimeSeason, type AnimeSort } from "./anilist";
import type { ExternalPoster } from "@/components/external-posters";
import type { Item } from "./types";
import { periodStart } from "./browse";

// Animes e mangás lidos da cópia do AniList no banco do Orbi (sem limite de requisições nem teto de 5 mil).
// Enquanto a cópia não existe (migração não aplicada ou importação não feita), cai na API do AniList.

export type CatalogKind = "anime" | "manga";
export type CatalogSort = "anticipated" | "week" | "month" | "year" | "popular" | "top" | "top-asc" | "release" | "release-old" | "title" | "title-desc";

export type CatalogQuery = {
  kind: CatalogKind;
  page: number;
  perPage: number;
  sort: CatalogSort;
  q?: string;
  genre?: string;
  decade?: number;
  season?: AnimeSeason;
  seasonYear?: number;
  showAdult?: boolean;
};

// Mínimo de títulos para considerar a cópia pronta (a importação completa traz dezenas de milhares).
const READY_MIN = 1000;

// A cópia daquele tipo já está no banco? (Uma consulta por requisição.)
export const mirrorReady = cache(async (kind: CatalogKind): Promise<boolean> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("source", "anilist")
    .not("source_updated_at", "is", null);
  return !error && (count ?? 0) >= READY_MIN;
});

const COLUMNS = "id, external_id, title, year, poster_url, is_adult_rated, tmdb_rating, status";

export const toPoster = (
  i: Pick<Item, "id" | "external_id" | "title" | "year" | "poster_url"> & { tmdb_rating?: number | null; status?: string | null },
): ExternalPoster => ({
  id: Number(i.external_id),
  itemId: i.id,
  title: i.title,
  year: i.year,
  poster: i.poster_url,
  rating: i.tmdb_rating ? i.tmdb_rating / 2 : null,
  unreleased: i.status === "NOT_YET_RELEASED",
});

// Ordenações das listagens → ordenação do AniList (quando ainda não há cópia no banco).
const API_SORT: Record<CatalogSort, AnimeSort> = {
  anticipated: "POPULARITY_DESC",
  week: "TRENDING_DESC",
  month: "POPULARITY_DESC",
  year: "POPULARITY_DESC",
  popular: "POPULARITY_DESC",
  top: "SCORE_DESC",
  "top-asc": "SCORE",
  release: "START_DATE_DESC",
  "release-old": "START_DATE",
  title: "TITLE_ROMAJI",
  "title-desc": "TITLE_ROMAJI_DESC",
};

export async function browseCatalog(q: CatalogQuery): Promise<{ list: ExternalPoster[]; total: number }> {
  if (!(await mirrorReady(q.kind))) {
    const found = await browseAnime({
      type: q.kind === "manga" ? "MANGA" : "ANIME",
      page: q.page,
      perPage: q.perPage,
      sort: API_SORT[q.sort],
      startFrom: periodStart(q.sort),
      search: q.q?.trim(),
      genre: q.genre,
      decade: q.decade,
      season: q.season,
      seasonYear: q.seasonYear,
      showAdult: q.showAdult,
      status: q.sort === "anticipated" ? "NOT_YET_RELEASED" : undefined,
    });
    return {
      list: found.list.map((a) => ({ id: a.id, title: animeTitle(a), year: animeYear(a), poster: animeCover(a), rating: a.averageScore ? a.averageScore / 20 : null, unreleased: a.status === "NOT_YET_RELEASED" })),
      total: found.total,
    };
  }

  const supabase = await createClient();
  let query = supabase.from("items").select(COLUMNS, { count: "exact" }).eq("kind", q.kind).eq("source", "anilist");
  if (!q.showAdult) query = query.eq("is_adult_rated", false);
  if (q.genre) query = query.contains("genres", [q.genre]);
  if (q.decade) query = query.gte("year", q.decade).lt("year", q.decade + 10);
  if (q.season && q.seasonYear) query = query.eq("season", q.season).eq("season_year", q.seasonYear);
  const text = q.q?.trim().slice(0, 100).replace(/[%,()]/g, " ");
  if (text) query = query.or(`title.ilike.%${text}%,original_title.ilike.%${text}%`);

  const desc = { ascending: false, nullsFirst: false } as const;
  const asc = { ascending: true, nullsFirst: false } as const;
  switch (q.sort) {
    case "anticipated":
      query = query.eq("status", "NOT_YET_RELEASED").order("tmdb_votes", desc);
      break;
    // "Em alta": o que está saindo agora, do mais popular para o menos.
    case "week":
      query = query.eq("status", "RELEASING").order("tmdb_votes", desc);
      break;
    case "month":
    case "year":
      query = query.gte("release_date", periodStart(q.sort)!).order("tmdb_votes", desc);
      break;
    case "popular":
      query = query.order("tmdb_votes", desc);
      break;
    case "top":
      // Sem um mínimo de público, a "melhor nota" fica cheia de títulos com 3 avaliações.
      query = query.gte("tmdb_votes", 1000).order("tmdb_rating", desc);
      break;
    case "top-asc":
      query = query.gte("tmdb_votes", 1000).order("tmdb_rating", asc);
      break;
    case "release":
      query = query.lte("release_date", new Date().toISOString().slice(0, 10)).order("release_date", desc);
      break;
    case "release-old":
      query = query.order("release_date", asc);
      break;
    case "title":
      query = query.order("title", asc);
      break;
    case "title-desc":
      query = query.order("title", desc);
      break;
  }
  query = query.order("id", asc);

  const from = (q.page - 1) * q.perPage;
  const { data, count } = await query.range(from, from + q.perPage - 1);
  return { list: (data ?? []).map(toPoster), total: count ?? 0 };
}

// Os mais populares de uma temporada de anime (Home e página da temporada), já como itens do catálogo.
export async function seasonItems(season: AnimeSeason, year: number, limit: number): Promise<Item[] | null> {
  if (!(await mirrorReady("anime"))) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("kind", "anime")
    .eq("source", "anilist")
    .eq("is_adult_rated", false)
    .eq("season", season)
    .eq("season_year", year)
    .order("tmdb_votes", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as Item[];
}

// Busca tolerante a erro de digitação (trigramas no Postgres), para as sugestões e as abas da busca.
// Sem a cópia, usa a busca do AniList (que não tolera erro).
export async function searchCatalog(text: string, kind: CatalogKind, limit = 20, showAdult = false): Promise<ExternalPoster[]> {
  const q = text.trim().slice(0, 100);
  if (q.length < 2) return [];
  if (!(await mirrorReady(kind))) {
    const found = await browseAnime({
      type: kind === "manga" ? "MANGA" : "ANIME",
      page: 1,
      perPage: limit,
      sort: "POPULARITY_DESC",
      search: q,
      showAdult,
    });
    return found.list.map((a) => ({ id: a.id, title: animeTitle(a), year: animeYear(a), poster: animeCover(a), rating: a.averageScore ? a.averageScore / 20 : null, unreleased: a.status === "NOT_YET_RELEASED" }));
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_catalog", { q, kinds: [kind], max_results: limit * 2 });
  return ((data ?? []) as Item[])
    .filter((i) => showAdult || !i.is_adult_rated)
    .slice(0, limit)
    .map(toPoster);
}

// Gêneros do AniList (filtro das listagens e das pastas de anime e mangá).
export const CATALOG_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music",
  "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];
