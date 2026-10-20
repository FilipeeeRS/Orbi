import "server-only";
import { createClient } from "./supabase/server";
import type { ExternalPoster } from "@/components/external-posters";
import type { Item } from "./types";

// Animes e mangás lidos da cópia do AniList no banco do Orbi (sem limite de requisições nem teto de 5 mil).

export type CatalogKind = "anime" | "manga";
export type CatalogSort = "week" | "popular" | "top" | "release" | "release-old" | "title" | "title-desc";

export type CatalogQuery = {
  kind: CatalogKind;
  page: number;
  perPage: number;
  sort: CatalogSort;
  q?: string;
  genre?: string;
  decade?: number;
  season?: string; // WINTER...
  seasonYear?: number;
  showAdult?: boolean;
};

const COLUMNS = "id, external_id, title, year, poster_url, is_adult_rated";

export const toPoster = (i: Pick<Item, "id" | "external_id" | "title" | "year" | "poster_url">): ExternalPoster => ({
  id: Number(i.external_id),
  itemId: i.id,
  title: i.title,
  year: i.year,
  poster: i.poster_url,
});

export async function browseCatalog(q: CatalogQuery): Promise<{ list: ExternalPoster[]; total: number }> {
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
    // "Em alta": o que está saindo agora, do mais popular para o menos.
    case "week":
      query = query.eq("status", "RELEASING").order("tmdb_votes", desc);
      break;
    case "popular":
      query = query.order("tmdb_votes", desc);
      break;
    case "top":
      // Sem um mínimo de público, a "melhor nota" fica cheia de títulos com 3 avaliações.
      query = query.gte("tmdb_votes", 1000).order("tmdb_rating", desc);
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

// Busca tolerante a erro de digitação (trigramas no Postgres), para as sugestões e a aba da busca.
export async function searchCatalog(text: string, kinds: CatalogKind[], limit = 20, showAdult = false): Promise<Item[]> {
  const q = text.trim().slice(0, 100);
  if (q.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_catalog", { q, kinds, max_results: limit * 2 });
  return ((data ?? []) as Item[]).filter((i) => showAdult || !i.is_adult_rated).slice(0, limit);
}

// Gêneros que existem no catálogo daquele tipo (filtro das listagens).
export const CATALOG_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music",
  "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];
