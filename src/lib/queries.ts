import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { EntryWithItem, MediaKind, Profile } from "./types";

const ENTRY_WITH_ITEM = "*, items!inner(*)";

export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
  return data as Profile | null;
});

export async function getProfileOverview(userId: string, kind: MediaKind = "movie") {
  const supabase = await createClient();
  const count = () =>
    supabase.from("entries").select("id, items!inner(kind)", { count: "exact", head: true }).eq("user_id", userId).eq("items.kind", kind);
  const list = () => supabase.from("entries").select(ENTRY_WITH_ITEM).eq("user_id", userId).eq("items.kind", kind);

  const otherKinds = (["series", "music", "game", "book"] as const).filter((k) => k !== kind);
  const countKind = (k: MediaKind) =>
    supabase.from("entries").select("id, items!inner(kind)", { count: "exact", head: true }).eq("user_id", userId).eq("items.kind", k);

  const [watched, watchlist, recent, favorites, watchlistPreview, ...rest] = await Promise.all([
    count().eq("status", "watched"),
    count().eq("status", "watchlist"),
    list()
      .eq("status", "watched")
      .order("watched_on", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(12),
    list().eq("liked", true).order("updated_at", { ascending: false }).limit(4),
    list().eq("status", "watchlist").order("created_at", { ascending: false }).limit(5),
    // Distribuição das notas de todas as pastas: quantos itens com ½★, ★, ... ★★★★★
    ...Array.from({ length: 10 }, (_, i) =>
      supabase.from("entries").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("rating", i + 1),
    ),
    // Itens nas outras pastas (séries, músicas, jogos, livros)
    ...otherKinds.map((k) => countKind(k)),
  ]);
  const ratingCounts = rest.slice(0, 10);
  const kindCounts = Object.fromEntries(otherKinds.map((k, i) => [k, rest[10 + i].count ?? 0])) as Partial<Record<MediaKind, number>>;

  return {
    watched: watched.count ?? 0,
    watchlist: watchlist.count ?? 0,
    recent: (recent.data ?? []) as EntryWithItem[],
    favorites: (favorites.data ?? []) as EntryWithItem[],
    watchlistPreview: (watchlistPreview.data ?? []) as EntryWithItem[],
    ratingCounts: ratingCounts.map((r) => r.count ?? 0),
    kindCounts,
  };
}

export const TABS = ["watched", "watchlist", "liked", "reviews"] as const;
export type Tab = (typeof TABS)[number];
export const SORTS = ["recent", "yours", "top", "title"] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 48;

export async function listEntries(userId: string, tab: Tab, sort: Sort, page: number, kind: MediaKind = "movie") {
  const supabase = await createClient();
  let query = supabase
    .from("entries")
    .select(ENTRY_WITH_ITEM, { count: "exact" })
    .eq("user_id", userId)
    .eq("items.kind", kind);

  if (tab === "watchlist") query = query.eq("status", "watchlist");
  else if (tab === "liked") query = query.eq("liked", true);
  else if (tab === "reviews") query = query.not("review", "is", null);
  else query = query.eq("status", "watched");

  // "yours" = nota do dono do perfil; "top" = nota média do TMDB
  if (sort === "yours") query = query.order("rating", { ascending: false, nullsFirst: false });
  else if (sort === "top") query = query.order("items(tmdb_rating)", { ascending: false, nullsFirst: false });
  else if (sort === "title") query = query.order("items(title)", { ascending: true });
  if (tab === "watchlist") query = query.order("created_at", { ascending: false });
  else query = query.order("watched_on", { ascending: false, nullsFirst: false });
  query = query.order("updated_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  return { entries: (data ?? []) as EntryWithItem[], total: count ?? 0 };
}

export type ReviewWithAuthor = EntryWithItem & {
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url">;
};

export async function getItemReviews(itemId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select("*, items!inner(*), profiles!inner(username, display_name, avatar_url)")
    .eq("item_id", itemId)
    .not("review", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ReviewWithAuthor[];
}

// Números da obra no Orbi: quantos viram, curtiram, querem ver e a média das notas.
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
