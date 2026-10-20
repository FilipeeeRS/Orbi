import "server-only";
import { createClient } from "./supabase/server";
import type { Item, Profile } from "./types";

// Listas personalizadas (tabelas lists e list_items). A RLS esconde as de perfis invisíveis.
export const MAX_LIST_ITEMS = 250;

export type ListSummary = {
  id: string;
  title: string;
  description: string | null;
  count: number;
  posters: (string | null)[]; // capas dos primeiros itens, para a colagem
  updated_at: string;
};

export type ListDetail = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner: Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
  items: Item[]; // na ordem da lista
};

export async function getUserLists(userId: string): Promise<ListSummary[]> {
  const supabase = await createClient();
  const { data: lists } = await supabase
    .from("lists")
    .select("id, title, description, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (!lists?.length) return [];

  const { data: rows } = await supabase
    .from("list_items")
    .select("list_id, position, items!inner(poster_url)")
    .in("list_id", lists.map((l) => l.id))
    .order("position", { ascending: true });
  const byList = new Map<string, (string | null)[]>();
  for (const row of rows ?? []) {
    const list = byList.get(row.list_id) ?? [];
    list.push((row.items as unknown as { poster_url: string | null }).poster_url);
    byList.set(row.list_id, list);
  }
  return lists.map((l) => {
    const posters = byList.get(l.id) ?? [];
    return { ...l, count: posters.length, posters: posters.slice(0, 5) } as ListSummary;
  });
}

export async function getList(id: string): Promise<ListDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("lists")
    .select("id, user_id, title, description, created_at, updated_at, owner:profiles!lists_user_id_fkey(username, display_name, avatar_url, avatar_ring)")
    .eq("id", id)
    .maybeSingle();
  if (!list) return null;
  const { data: rows } = await supabase
    .from("list_items")
    .select("position, items!inner(*)")
    .eq("list_id", id)
    .order("position", { ascending: true })
    .limit(MAX_LIST_ITEMS);
  return { ...(list as unknown as Omit<ListDetail, "items">), items: (rows ?? []).map((r) => r.items as unknown as Item) };
}

export type PopularList = ListSummary & { owner: Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring"> };

// Home: listas de todo mundo com mais obras adicionadas na última semana; completa com as atualizadas
// por último. (A RLS já esconde as de perfis invisíveis.)
export async function getPopularLists(limit = 6): Promise<PopularList[]> {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: added } = await supabase.from("list_items").select("list_id").gte("added_at", weekAgo).limit(2000);
  const activity = new Map<string, number>();
  for (const row of added ?? []) activity.set(row.list_id, (activity.get(row.list_id) ?? 0) + 1);

  const { data: lists } = await supabase
    .from("lists")
    .select("id, title, description, updated_at, owner:profiles!lists_user_id_fkey(username, display_name, avatar_url, avatar_ring)")
    .order("updated_at", { ascending: false })
    .limit(60);
  if (!lists?.length) return [];

  const { data: rows } = await supabase
    .from("list_items")
    .select("list_id, position, items!inner(poster_url)")
    .in("list_id", lists.map((l) => l.id))
    .order("position", { ascending: true });
  const byList = new Map<string, (string | null)[]>();
  for (const row of rows ?? []) {
    const list = byList.get(row.list_id) ?? [];
    list.push((row.items as unknown as { poster_url: string | null }).poster_url);
    byList.set(row.list_id, list);
  }
  return lists
    .map((l) => {
      const posters = byList.get(l.id) ?? [];
      return { ...l, count: posters.length, posters: posters.slice(0, 5) } as unknown as PopularList;
    })
    .filter((l) => l.count > 0 && l.owner)
    .sort((a, b) => (activity.get(b.id) ?? 0) - (activity.get(a.id) ?? 0) || b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}
