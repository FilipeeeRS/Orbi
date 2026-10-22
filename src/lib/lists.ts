import "server-only";
import type { ListComment } from "@/app/lists/social-actions";
import { createClient } from "./supabase/server";
import { getViewer } from "./session";
import { periodSince } from "./queries";
import type { Item, MediaKind, Profile } from "./types";

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

export const LIST_SORTS = ["week", "month", "year", "popular", "comments", "title", "title-desc", "recent", "recent-old"] as const;
export type UserListSort = (typeof LIST_SORTS)[number];

// Listas de um perfil, como cartões (com quem fez, curtidas, comentários e se quem vê curtiu/salvou).
// Popularidade = curtidas (no período, para semana/mês/ano; empate pelas de sempre); "comments" = mais comentadas.
export async function getUserLists(userId: string, sort: UserListSort = "recent", q?: string): Promise<PopularList[]> {
  const supabase = await createClient();
  let query = supabase
    .from("lists")
    .select("id, title, description, updated_at, owner:profiles!lists_user_id_fkey(username, display_name, avatar_url, avatar_ring)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: sort === "recent-old" })
    .limit(200);
  const text = q?.trim().slice(0, 100).replace(/[%,()]/g, " ");
  if (text) query = query.ilike("title", `%${text}%`);
  const { data: lists } = await query;
  if (!lists?.length) return [];
  const ids = lists.map((l) => l.id);

  const [{ data: rows }, { data: likes }, { data: comments }, viewer] = await Promise.all([
    supabase.from("list_items").select("list_id, position, items!inner(poster_url)").in("list_id", ids).order("position", { ascending: true }),
    supabase.from("list_likes").select("list_id, user_id, created_at").in("list_id", ids).limit(50000),
    supabase.from("list_comments").select("list_id").in("list_id", ids).limit(50000),
    getViewer(),
  ]);
  const { data: saves } = viewer
    ? await supabase.from("list_saves").select("list_id").eq("user_id", viewer.id).in("list_id", ids)
    : { data: [] };

  const byList = new Map<string, (string | null)[]>();
  for (const row of rows ?? []) {
    const list = byList.get(row.list_id) ?? [];
    list.push((row.items as unknown as { poster_url: string | null }).poster_url);
    byList.set(row.list_id, list);
  }
  const since = sort === "week" || sort === "month" || sort === "year" ? periodSince(sort) : "";
  const likeCount = new Map<string, number>();
  const inPeriod = new Map<string, number>();
  const mine = new Set<string>();
  for (const l of likes ?? []) {
    likeCount.set(l.list_id, (likeCount.get(l.list_id) ?? 0) + 1);
    if (l.created_at >= since) inPeriod.set(l.list_id, (inPeriod.get(l.list_id) ?? 0) + 1);
    if (l.user_id === viewer?.id) mine.add(l.list_id);
  }
  const commentCount = new Map<string, number>();
  for (const c of comments ?? []) commentCount.set(c.list_id, (commentCount.get(c.list_id) ?? 0) + 1);

  const result = lists.map((l) => {
    const posters = byList.get(l.id) ?? [];
    return {
      ...l,
      count: posters.length,
      posters: posters.slice(0, 5),
      likes: likeCount.get(l.id) ?? 0,
      liked: mine.has(l.id),
      saved: (saves ?? []).some((r) => r.list_id === l.id),
      comments: commentCount.get(l.id) ?? 0,
    } as unknown as PopularList;
  });
  if (sort === "title" || sort === "title-desc") result.sort((a, b) => (sort === "title" ? 1 : -1) * a.title.localeCompare(b.title));
  else if (sort === "comments") result.sort((a, b) => b.comments - a.comments || b.likes - a.likes);
  else if (since || sort === "popular")
    result.sort((a, b) => (inPeriod.get(b.id) ?? 0) - (inPeriod.get(a.id) ?? 0) || b.likes - a.likes);
  return result;
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

export type PopularList = ListSummary & {
  owner: Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
  likes: number;
  liked: boolean; // quem está vendo já curtiu
  saved: boolean; // quem está vendo salvou (o marcador)
  comments: number;
};

// Home: listas de todo mundo com mais obras adicionadas na última semana; completa com as atualizadas
// por último. (A RLS já esconde as de perfis invisíveis.)
export async function getPopularLists(limit = 3): Promise<PopularList[]> {
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
  const top = lists
    .map((l) => {
      const posters = byList.get(l.id) ?? [];
      return { ...l, count: posters.length, posters: posters.slice(0, 5), likes: 0, liked: false, saved: false, comments: 0 } as unknown as PopularList;
    })
    .filter((l) => l.count > 0 && l.owner)
    .sort((a, b) => (activity.get(b.id) ?? 0) - (activity.get(a.id) ?? 0) || b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);

  // Curtidas e comentários (se as tabelas ainda não existirem, ficam em 0)
  const ids = top.map((l) => l.id);
  const [{ data: likes }, { data: comments }, viewer] = await Promise.all([
    supabase.from("list_likes").select("list_id, user_id").in("list_id", ids),
    supabase.from("list_comments").select("list_id").in("list_id", ids),
    getViewer(),
  ]);
  const { data: saves } = viewer
    ? await supabase.from("list_saves").select("list_id").eq("user_id", viewer.id).in("list_id", ids)
    : { data: [] };
  for (const l of top) {
    l.saved = (saves ?? []).some((r) => r.list_id === l.id);
    l.likes = (likes ?? []).filter((r) => r.list_id === l.id).length;
    l.liked = !!viewer && (likes ?? []).some((r) => r.list_id === l.id && r.user_id === viewer.id);
    l.comments = (comments ?? []).filter((r) => r.list_id === l.id).length;
  }
  return top;
}

// Curtidas (e se quem está vendo curtiu), se está salva por quem vê e comentários de uma lista.
// Sem as tabelas ainda, vem vazio.
export async function getListSocial(listId: string, viewerId: string | null) {
  const supabase = await createClient();
  const [{ data: likes }, { data: comments }, { data: saved }] = await Promise.all([
    supabase.from("list_likes").select("user_id").eq("list_id", listId).limit(10000),
    supabase
      .from("list_comments")
      .select("id, list_id, user_id, body, created_at, author:profiles!list_comments_user_id_fkey(username, display_name, avatar_url, avatar_ring)")
      .eq("list_id", listId)
      .order("created_at", { ascending: true })
      .limit(500),
    viewerId
      ? supabase.from("list_saves").select("list_id").eq("list_id", listId).eq("user_id", viewerId).limit(1)
      : Promise.resolve({ data: [] }),
  ]);
  return {
    saved: !!saved?.length,
    likes: likes?.length ?? 0,
    liked: !!viewerId && (likes ?? []).some((l) => l.user_id === viewerId),
    comments: (comments ?? []) as unknown as ListComment[],
  };
}

export type ListSort = "popular" | "recent" | "comments";

// "Todas as listas": as de todo mundo com pelo menos uma obra. Populares = mais curtidas (empate: mais
// obras adicionadas na semana, depois a atualizada por último); recentes = atualizadas por último;
// comentadas = mais comentários.
export async function browseLists(
  sort: ListSort,
  page: number,
  folder: MediaKind | null = null,
  perPage = 24,
): Promise<{ lists: PopularList[]; pages: number }> {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: lists }, { data: items }, { data: likes }, { data: allComments }, viewer] = await Promise.all([
    supabase
      .from("lists")
      .select("id, title, description, updated_at, owner:profiles!lists_user_id_fkey(username, display_name, avatar_url, avatar_ring)")
      .order("updated_at", { ascending: false })
      .limit(1000),
    supabase.from("list_items").select("list_id, added_at, items!inner(kind)").limit(50000),
    supabase.from("list_likes").select("list_id, user_id").limit(50000),
    supabase.from("list_comments").select("list_id").limit(50000),
    getViewer(),
  ]);
  const commentCount = new Map<string, number>();
  for (const c of allComments ?? []) commentCount.set(c.list_id, (commentCount.get(c.list_id) ?? 0) + 1);
  const count = new Map<string, number>();
  const week = new Map<string, number>();
  const inFolder = new Set<string>(); // listas com pelo menos uma obra da pasta escolhida
  for (const r of items ?? []) {
    count.set(r.list_id, (count.get(r.list_id) ?? 0) + 1);
    const kind = (r.items as unknown as { kind: string }).kind;
    if (folder && (kind === folder || (folder === "series" && kind === "season"))) inFolder.add(r.list_id);
    if (r.added_at >= weekAgo) week.set(r.list_id, (week.get(r.list_id) ?? 0) + 1);
  }
  const likeCount = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of likes ?? []) {
    likeCount.set(r.list_id, (likeCount.get(r.list_id) ?? 0) + 1);
    if (r.user_id === viewer?.id) mine.add(r.list_id);
  }

  type Row = { id: string; updated_at: string };
  const all = ((lists ?? []) as unknown as (Row & { owner: unknown })[]).filter(
    (l) => count.get(l.id) && l.owner && (!folder || inFolder.has(l.id)),
  );
  if (sort === "comments")
    all.sort((a, b) => (commentCount.get(b.id) ?? 0) - (commentCount.get(a.id) ?? 0) || (likeCount.get(b.id) ?? 0) - (likeCount.get(a.id) ?? 0));
  else if (sort === "popular")
    all.sort(
      (a, b) =>
        (likeCount.get(b.id) ?? 0) - (likeCount.get(a.id) ?? 0) ||
        (week.get(b.id) ?? 0) - (week.get(a.id) ?? 0) ||
        b.updated_at.localeCompare(a.updated_at),
    );
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  const slice = all.slice((page - 1) * perPage, page * perPage);
  if (!slice.length) return { lists: [], pages };

  const ids = slice.map((l) => l.id);
  const [{ data: rows }, { data: saves }] = await Promise.all([
    supabase.from("list_items").select("list_id, position, items!inner(poster_url)").in("list_id", ids).lt("position", 5).order("position"),
    viewer ? supabase.from("list_saves").select("list_id").eq("user_id", viewer.id).in("list_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const posters = new Map<string, (string | null)[]>();
  for (const r of rows ?? []) {
    const list = posters.get(r.list_id) ?? [];
    list.push((r.items as unknown as { poster_url: string | null }).poster_url);
    posters.set(r.list_id, list);
  }
  return {
    pages,
    lists: slice.map(
      (l) =>
        ({
          ...l,
          count: count.get(l.id) ?? 0,
          posters: posters.get(l.id) ?? [],
          likes: likeCount.get(l.id) ?? 0,
          liked: mine.has(l.id),
          saved: (saves ?? []).some((s) => s.list_id === l.id),
          comments: commentCount.get(l.id) ?? 0,
        }) as unknown as PopularList,
    ),
  };
}
