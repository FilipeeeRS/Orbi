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
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const count = () =>
    supabase.from("entries").select("id, items!inner(kind)", { count: "exact", head: true }).eq("user_id", userId).eq("items.kind", kind);
  const list = () => supabase.from("entries").select(ENTRY_WITH_ITEM).eq("user_id", userId).eq("items.kind", kind);

  const [watched, thisYear, watchlist, recent, favorites] = await Promise.all([
    count().eq("status", "watched"),
    count().eq("status", "watched").gte("watched_on", yearStart),
    count().eq("status", "watchlist"),
    list()
      .eq("status", "watched")
      .order("watched_on", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(12),
    list().eq("liked", true).order("updated_at", { ascending: false }).limit(6),
  ]);

  return {
    watched: watched.count ?? 0,
    thisYear: thisYear.count ?? 0,
    watchlist: watchlist.count ?? 0,
    recent: (recent.data ?? []) as EntryWithItem[],
    favorites: (favorites.data ?? []) as EntryWithItem[],
  };
}

export const TABS = ["watched", "watchlist", "liked", "reviews"] as const;
export type Tab = (typeof TABS)[number];
export const SORTS = ["recent", "rating", "title"] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 48;

export async function listEntries(userId: string, tab: Tab, sort: Sort, page: number) {
  const supabase = await createClient();
  let query = supabase
    .from("entries")
    .select(ENTRY_WITH_ITEM, { count: "exact" })
    .eq("user_id", userId)
    .eq("items.kind", "movie");

  if (tab === "watchlist") query = query.eq("status", "watchlist");
  else if (tab === "liked") query = query.eq("liked", true);
  else if (tab === "reviews") query = query.not("review", "is", null);
  else query = query.eq("status", "watched");

  if (sort === "rating") query = query.order("rating", { ascending: false, nullsFirst: false });
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
