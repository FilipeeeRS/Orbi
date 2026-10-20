import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { applyArtToEntries } from "./art";
import type { EntryWithItem, FolderKind, Item, MediaKind, Profile } from "./types";

const ENTRY_WITH_ITEM = "*, items!inner(*)";

export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
  return data as Profile | null;
});

// artViewerId: quem está vendo; os pôsteres que essa pessoa escolheu substituem os padrão (é pessoal).
export async function getProfileOverview(userId: string, kind: MediaKind = "movie", artViewerId: string | null = null) {
  const supabase = await createClient();
  const count = () =>
    supabase.from("entries").select("id, items!inner(kind)", { count: "exact", head: true }).eq("user_id", userId).eq("items.kind", kind);
  const list = () => supabase.from("entries").select(ENTRY_WITH_ITEM).eq("user_id", userId).eq("items.kind", kind);

  const otherKinds = (["series", "book", "anime", "manga", "game", "music"] as const).filter((k) => k !== kind);
  const countKind = (k: MediaKind) =>
    supabase.from("entries").select("id, items!inner(kind)", { count: "exact", head: true }).eq("user_id", userId).eq("items.kind", k);

  const [watched, watchlist, recent, favorites, watchlistPreview, recentReviews, ...rest] = await Promise.all([
    count().eq("status", "watched"),
    count().eq("status", "watchlist"),
    // Atividade recente: filmes e séries juntos
    supabase
      .from("entries")
      .select(ENTRY_WITH_ITEM)
      .eq("user_id", userId)
      .in("items.kind", ["movie", "series"])
      .eq("status", "watched")
      .order("watched_on", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(16),
    list().eq("liked", true).order("updated_at", { ascending: false }).limit(4),
    list().eq("status", "watchlist").order("created_at", { ascending: false }).limit(5),
    // Reviews mais recentes, de qualquer pasta
    supabase
      .from("entries")
      .select(ENTRY_WITH_ITEM)
      .eq("user_id", userId)
      .not("review", "is", null)
      .order("updated_at", { ascending: false })
      .limit(3),
    // Distribuição das notas de todas as pastas: quantos itens com ½★, ★, ... ★★★★★
    ...Array.from({ length: 10 }, (_, i) =>
      supabase.from("entries").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("rating", i + 1),
    ),
    // Itens nas outras pastas (séries, músicas, jogos, livros)
    ...otherKinds.map((k) => countKind(k)),
  ]);
  const ratingCounts = rest.slice(0, 10);
  // Pôster/fundo que quem está vendo escolheu, numa consulta só para todas as listas.
  const lists = [recent.data, favorites.data, watchlistPreview.data, recentReviews.data].flatMap(
    (rows) => (rows ?? []) as EntryWithItem[],
  );
  const withArtAll = artViewerId ? await applyArtToEntries(artViewerId, lists) : lists;
  const byId = new Map(withArtAll.map((e) => [e.id, e]));
  const withArt = (rows: unknown) => ((rows ?? []) as EntryWithItem[]).map((e) => byId.get(e.id) ?? e);
  const kindCounts = Object.fromEntries(otherKinds.map((k, i) => [k, rest[10 + i].count ?? 0])) as Partial<Record<MediaKind, number>>;

  return {
    watched: watched.count ?? 0,
    watchlist: watchlist.count ?? 0,
    recent: withArt(recent.data),
    favorites: withArt(favorites.data),
    watchlistPreview: withArt(watchlistPreview.data),
    recentReviews: withArt(recentReviews.data),
    ratingCounts: ratingCounts.map((r) => r.count ?? 0),
    kindCounts,
  };
}

// "watching" (Assistindo) só aparece na pasta de séries.
export const TABS = ["watched", "watching", "liked", "watchlist", "reviews", "lists"] as const;
export type Tab = (typeof TABS)[number];
// Ordenações das pastas (valor da URL). "recent" (adicionados por último) é a padrão.
export const SORTS = [
  "recent",
  "recent-old",
  "release",
  "release-old",
  "yours",
  "top",
  "popular",
  "title",
  "title-desc",
  "runtime",
  "runtime-desc",
] as const;
export type Sort = (typeof SORTS)[number];
export const DEFAULT_SORT: Sort = "recent";


export type ListFilters = {
  decade?: number; // 1990 = anos 90
  genre?: number; // id de gênero do TMDB
  genreName?: string; // gênero por nome (animes e mangás, do AniList)
  rating?: number | "none"; // 1..10 (meias estrelas) ou sem nota
  q?: string; // parte do título
};

export const PAGE_SIZE = 48;

export async function listEntries(
  userId: string,
  tab: Tab,
  sort: Sort,
  page: number,
  kind: FolderKind = "movie",
  filters: ListFilters = {},
  locale = "pt",
  artViewerId: string | null = null, // pôsteres escolhidos por quem está vendo
) {
  // Listas personalizadas ainda não existem: a aba aparece, mas vazia.
  if (tab === "lists") return { entries: [] as EntryWithItem[], total: 0 };
  const supabase = await createClient();
  let query = supabase.from("entries").select(ENTRY_WITH_ITEM, { count: "exact" }).eq("user_id", userId);
  // "Tudo" não lista temporadas soltas: elas aparecem dentro da página da série.
  query = kind === "all" ? query.neq("items.kind", "season") : query.eq("items.kind", kind);

  if (tab === "watchlist") query = query.eq("status", "watchlist");
  else if (tab === "watching") query = query.eq("status", "watching");
  else if (tab === "liked") query = query.eq("liked", true);
  else if (tab === "reviews") query = query.not("review", "is", null);
  else query = query.eq("status", "watched");

  // Filtros
  if (filters.decade) query = query.gte("items.year", filters.decade).lt("items.year", filters.decade + 10);
  if (filters.genre) query = query.contains("items.genre_ids", [filters.genre]);
  if (filters.genreName) query = query.contains("items.genres", [filters.genreName]);
  if (filters.rating === "none") query = query.is("rating", null);
  else if (filters.rating) query = query.eq("rating", filters.rating);
  const q = filters.q?.trim().slice(0, 100).replace(/[%,()]/g, " ");
  if (q) {
    const pattern = `%${q}%`;
    query = query.or(
      `title.ilike.${pattern},original_title.ilike.${pattern},translations->${locale}->>title.ilike.${pattern}`,
      { referencedTable: "items" },
    );
  }

  // Ordenação (sempre com desempate pelo mais recente)
  const desc = { ascending: false, nullsFirst: false } as const;
  const asc = { ascending: true, nullsFirst: false } as const;
  switch (sort) {
    case "release":
      query = query.order("items(release_date)", desc).order("items(year)", desc);
      break;
    case "release-old":
      query = query.order("items(release_date)", asc).order("items(year)", asc);
      break;
    case "yours":
      query = query.order("rating", desc);
      break;
    case "top":
      query = query.order("items(tmdb_rating)", desc);
      break;
    case "popular":
      query = query.order("items(tmdb_votes)", desc);
      break;
    case "title":
      query = query.order("items(title)", asc);
      break;
    case "title-desc":
      query = query.order("items(title)", desc);
      break;
    case "runtime":
      query = query.order("items(runtime)", asc);
      break;
    case "runtime-desc":
      query = query.order("items(runtime)", desc);
      break;
  }
  // Desempate (e as ordens "recent"/"recent-old"): quando entrou na pasta. Vistos pela data em que viu;
  // watchlist pela data em que foi adicionado; assistindo pela última mudança.
  const newest = sort !== "recent-old";
  if (tab === "watchlist") query = query.order("created_at", { ascending: !newest });
  else if (tab !== "watching") query = query.order("watched_on", { ascending: !newest, nullsFirst: false });
  query = query.order("updated_at", { ascending: !newest });

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  const entries = (data ?? []) as EntryWithItem[];
  return { entries: artViewerId ? await applyArtToEntries(artViewerId, entries) : entries, total: count ?? 0 };
}

export type ReviewWithAuthor = EntryWithItem & {
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url">;
};

export async function getItemReviews(itemId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select("*, items!inner(*), profiles!entries_user_id_fkey!inner(username, display_name, avatar_url)")
    .eq("item_id", itemId)
    .not("review", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ReviewWithAuthor[];
}

// Números da obra no Orbi: quantos viram, curtiram, querem ver e a média das notas.
export type SourceCounts = { watched?: number; liked?: number; watchlist?: number };

// Números da página de uma obra: os da fonte (TMDB, AniList, Open Library, Steam) somados aos do Orbi,
// para não começar tudo em zero. A nota é a da fonte (0..10 → 0..5) misturada com as notas do Orbi,
// cada lado pesando pela quantidade de votos: com milhares de votos na fonte, uma nota nova mexe pouco.
export function withSourceStats(
  stats: Awaited<ReturnType<typeof getItemStats>>,
  item: { tmdb_rating: number | null; tmdb_votes: number | null },
  counts: SourceCounts = {},
) {
  const sourceRating = item.tmdb_rating != null && item.tmdb_rating > 0 ? item.tmdb_rating / 2 : null;
  const sourceVotes = sourceRating != null ? Math.max(1, item.tmdb_votes ?? 0) : 0;
  const orbiSum = (stats.average ?? 0) * stats.ratings;
  const totalVotes = sourceVotes + stats.ratings;
  return {
    watched: stats.watched + (counts.watched ?? 0),
    likes: stats.likes + (counts.liked ?? 0),
    watchlist: stats.watchlist + (counts.watchlist ?? 0),
    average: totalVotes ? ((sourceRating ?? 0) * sourceVotes + orbiSum) / totalVotes : null,
    ratings: totalVotes,
  };
}

export async function getItemStats(itemId: string) {
  const supabase = await createClient();
  const count = () => supabase.from("entries").select("id", { count: "exact", head: true }).eq("item_id", itemId);
  const [watched, likes, watchlist, ratings] = await Promise.all([
    count().eq("status", "watched"),
    count().eq("liked", true),
    count().eq("status", "watchlist"),
    supabase.from("entries").select("rating").eq("item_id", itemId).not("rating", "is", null).limit(5000),
  ]);
  const values = (ratings.data ?? []).map((r) => r.rating as number);
  return {
    watched: watched.count ?? 0,
    likes: likes.count ?? 0,
    watchlist: watchlist.count ?? 0,
    average: values.length ? values.reduce((a, b) => a + b, 0) / values.length / 2 : null,
    ratings: values.length,
  };
}

export type FriendProfile = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

// Amigos = pessoas que o usuário segue (modelo do Letterboxd, sem aprovação).
export async function getFriends(userId: string, limit = 24) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("follows")
    .select("created_at, profiles!follows_followee_id_fkey(id, username, display_name, avatar_url)", { count: "exact" })
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const list = (data ?? []).map((row) => row.profiles as unknown as FriendProfile).filter(Boolean);
  return { count: count ?? 0, list };
}

export async function isFollowing(followerId: string, followeeId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId);
  return (count ?? 0) > 0;
}

// Estado do usuário logado para uma lista de itens (atalhos ✓/♥ nos pôsteres).
export async function getViewerStates(viewerId: string, itemIds: string[]) {
  const states = new Map<string, { watched: boolean; liked: boolean; watchlist: boolean; watching: boolean; hasDetails: boolean }>();
  if (!itemIds.length) return states;
  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select("item_id, status, liked, rating, review")
    .eq("user_id", viewerId)
    .in("item_id", [...new Set(itemIds)]);
  for (const e of data ?? []) {
    states.set(e.item_id, {
      watched: e.status === "watched",
      liked: e.liked,
      watchlist: e.status === "watchlist",
      watching: e.status === "watching",
      hasDetails: e.rating !== null || e.review !== null,
    });
  }
  return states;
}

// Itens pelos ids, mantendo a ordem dada (favoritos escolhidos pelo usuário).
export async function getItemsByIds(ids: string[]) {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("items").select("*").in("id", ids);
  const byId = new Map((data ?? []).map((i) => [i.id as string, i as Item]));
  return ids.map((id) => byId.get(id)).filter((i): i is Item => !!i);
}

// Quantos likes cada review tem e quais o usuário logado já curtiu.
export async function getReviewLikes(entryIds: string[], viewerId: string | null) {
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  if (!entryIds.length) return { counts, mine };
  const supabase = await createClient();
  const { data } = await supabase.from("review_likes").select("entry_id, user_id").in("entry_id", entryIds);
  for (const row of data ?? []) {
    counts.set(row.entry_id, (counts.get(row.entry_id) ?? 0) + 1);
    if (row.user_id === viewerId) mine.add(row.entry_id);
  }
  return { counts, mine };
}

// Quantos comentários cada review tem (para o 💬 com número embaixo da review).
export async function getReviewCommentCounts(entryIds: string[]) {
  const counts = new Map<string, number>();
  if (!entryIds.length) return counts;
  const supabase = await createClient();
  const { data } = await supabase.from("review_comments").select("entry_id").in("entry_id", entryIds).is("deleted_at", null);
  for (const row of data ?? []) counts.set(row.entry_id, (counts.get(row.entry_id) ?? 0) + 1);
  return counts;
}
