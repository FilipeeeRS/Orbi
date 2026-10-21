import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { Item, Profile } from "./types";

// Notificações montadas a partir do que já existe (sem tabela própria):
// - sociais: curtidas e comentários nas minhas reviews e listas, respostas, curtidas em comentários, novos seguidores;
// - lançamentos: algo da minha watchlist que estreou nos últimos 30 dias;
// - conta: a conta entrou num aparelho/navegador novo (tabela user_devices);
// - boas-vindas (no cadastro), que leva para "O que é o Orbi".
// Lidas = as que a pessoa clicou (cookie com chaves curtas); as anteriores ao antigo "lido até" também.
export const NOTIFICATIONS_SEEN_COOKIE = "orbi-notifications-seen";

export type NotificationActor = Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
type ItemRef = Pick<Item, "id" | "kind" | "title" | "translations" | "source" | "external_id" | "year">;

export type NotificationKind =
  | "like"
  | "comment"
  | "reply"
  | "follow"
  | "commentLike"
  | "listLike"
  | "listComment"
  | "release"
  | "device"
  | "welcome";
export const SOCIAL_KINDS: NotificationKind[] = ["like", "comment", "reply", "follow", "commentLike", "listLike", "listComment"];

export type Notification = {
  id: string;
  kind: NotificationKind;
  actor: NotificationActor | null; // null em lançamentos, conta e boas-vindas
  created_at: string;
  item: ItemRef | null; // obra da review (curtida, comentário, resposta) ou que estreou
  body: string | null; // texto do comentário, aparelho do novo acesso
  list?: { id: string; title: string; username: string } | null; // lista curtida ou comentada
};

const ACTOR = "username, display_name, avatar_url, avatar_ring";
const ITEM = "id, kind, title, translations, source, external_id, year";

export async function getNotificationsSeenAt(): Promise<string | null> {
  return (await cookies()).get(NOTIFICATIONS_SEEN_COOKIE)?.value ?? null;
}

// Até 100 notificações, da mais nova para a mais antiga. Uma ida ao banco só (as consultas filtram pelo
// dono através das junções) e uma vez por carregamento: o número do menu e a Home usam a mesma busca.
export async function getNotifications(userId: string, opts: { limit?: number } = {}) {
  return (await loadNotifications(userId)).slice(0, opts.limit ?? 50);
}

const MAX = 100;

const loadNotifications = cache(async (userId: string): Promise<Notification[]> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const recent = <Q extends { order: (c: string, o: { ascending: boolean }) => Q; limit: (n: number) => Q }>(q: Q) =>
    q.order("created_at", { ascending: false }).limit(MAX);

  const [likes, comments, replies, follows, commentLikes, releases, devices, profile, listLikes, listComments] = await Promise.all([
    // Curtidas nas minhas reviews
    recent(
      supabase
        .from("review_likes")
        .select(`entry_id, user_id, created_at, actor:profiles!review_likes_user_id_fkey(${ACTOR}), entry:entries!inner(user_id, items!inner(${ITEM}))`)
        .eq("entry.user_id", userId)
        .neq("user_id", userId),
    ),
    // Comentários nas minhas reviews
    recent(
      supabase
        .from("review_comments")
        .select(`id, entry_id, body, created_at, actor:profiles!review_comments_user_id_fkey(${ACTOR}), entry:entries!inner(user_id, items!inner(${ITEM}))`)
        .eq("entry.user_id", userId)
        .neq("user_id", userId)
        .is("deleted_at", null),
    ),
    // Respostas a comentários meus (em qualquer review)
    recent(
      supabase
        .from("review_comments")
        .select(
          `id, entry_id, body, created_at, actor:profiles!review_comments_user_id_fkey(${ACTOR}), parent:parent_id!inner(user_id), entry:entries!inner(items!inner(${ITEM}))`,
        )
        .eq("parent.user_id", userId)
        .neq("user_id", userId)
        .is("deleted_at", null),
    ),
    recent(supabase.from("follows").select(`follower_id, created_at, actor:profiles!follows_follower_id_fkey(${ACTOR})`).eq("followee_id", userId)),
    // Curtidas nos meus comentários
    recent(
      supabase
        .from("comment_likes")
        .select(
          `comment_id, user_id, created_at, actor:profiles!comment_likes_user_id_fkey(${ACTOR}), comment:review_comments!inner(user_id, entry:entries!inner(items!inner(${ITEM})))`,
        )
        .eq("comment.user_id", userId)
        .neq("user_id", userId),
    ),
    // Da minha watchlist, o que estreou nos últimos 30 dias
    supabase
      .from("entries")
      .select(`item_id, items!inner(${ITEM}, release_date)`)
      .eq("user_id", userId)
      .eq("status", "watchlist")
      .gte("items.release_date", monthAgo)
      .lte("items.release_date", today)
      .limit(MAX),
    // Aparelhos em que a conta entrou
    supabase.from("user_devices").select("device_key, label, first_seen").eq("user_id", userId).order("first_seen"),
    supabase.from("profiles").select("created_at, username").eq("id", userId).maybeSingle(),
    // Curtidas e comentários nas minhas listas
    recent(
      supabase
        .from("list_likes")
        .select(`list_id, user_id, created_at, actor:profiles!list_likes_user_id_fkey(${ACTOR}), list:lists!inner(id, title, user_id)`)
        .eq("list.user_id", userId)
        .neq("user_id", userId),
    ),
    recent(
      supabase
        .from("list_comments")
        .select(`id, list_id, body, created_at, actor:profiles!list_comments_user_id_fkey(${ACTOR}), list:lists!inner(id, title, user_id)`)
        .eq("list.user_id", userId)
        .neq("user_id", userId),
    ),
  ]);

  const me = profile.data as { created_at: string; username: string } | null;
  const listRef = (l: unknown) => {
    const list = l as { id: string; title: string } | null;
    return list ? { id: list.id, title: list.title, username: me?.username ?? "" } : null;
  };
  const rows = (r: { data: unknown }) => (r.data ?? []) as Record<string, unknown>[];
  const itemOf = (entry: unknown) => (entry as { items: ItemRef } | null)?.items ?? null;

  const list: Notification[] = [];
  for (const r of rows(releases)) {
    const item = r.items as ItemRef & { release_date: string };
    list.push({ id: `release-${r.item_id}`, kind: "release", actor: null, created_at: `${item.release_date}T12:00:00.000Z`, item, body: null });
  }
  // O primeiro aparelho é o do cadastro; os seguintes são "novo acesso".
  for (const d of (rows(devices) as unknown as { device_key: string; label: string; first_seen: string }[]).slice(1)) {
    list.push({ id: `device-${d.device_key}`, kind: "device", actor: null, created_at: d.first_seen, item: null, body: d.label });
  }
  // Boas-vindas: no cadastro (a primeira notificação de todo mundo)
  if (me?.created_at) list.push({ id: "welcome", kind: "welcome", actor: null, created_at: me.created_at, item: null, body: null });

  const seenComments = new Set<string>();
  // Resposta a um comentário meu conta como "respondeu", mesmo se for na minha própria review.
  for (const r of rows(replies)) {
    seenComments.add(r.id as string);
    list.push({ id: `reply-${r.id}`, kind: "reply", actor: r.actor as NotificationActor, created_at: r.created_at as string, item: itemOf(r.entry), body: r.body as string });
  }
  for (const c of rows(comments)) {
    if (seenComments.has(c.id as string)) continue;
    list.push({ id: `comment-${c.id}`, kind: "comment", actor: c.actor as NotificationActor, created_at: c.created_at as string, item: itemOf(c.entry), body: c.body as string });
  }
  for (const l of rows(likes)) {
    list.push({ id: `like-${l.entry_id}-${l.user_id}`, kind: "like", actor: l.actor as NotificationActor, created_at: l.created_at as string, item: itemOf(l.entry), body: null });
  }
  for (const l of rows(commentLikes)) {
    const comment = l.comment as { entry: unknown } | null;
    list.push({ id: `clike-${l.comment_id}-${l.user_id}`, kind: "commentLike", actor: l.actor as NotificationActor, created_at: l.created_at as string, item: itemOf(comment?.entry), body: null });
  }
  for (const l of rows(listLikes)) {
    list.push({ id: `llike-${l.list_id}-${l.user_id}`, kind: "listLike", actor: l.actor as NotificationActor, created_at: l.created_at as string, item: null, body: null, list: listRef(l.list) });
  }
  for (const c of rows(listComments)) {
    list.push({ id: `lcomment-${c.id}`, kind: "listComment", actor: c.actor as NotificationActor, created_at: c.created_at as string, item: null, body: c.body as string, list: listRef(c.list) });
  }
  for (const f of rows(follows)) {
    list.push({ id: `follow-${f.follower_id}`, kind: "follow", actor: f.actor as NotificationActor, created_at: f.created_at as string, item: null, body: null });
  }

  return list
    .filter((n) => n.actor || !SOCIAL_KINDS.includes(n.kind))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, MAX);
});

export const NOTIFICATIONS_READ_COOKIE = "orbi-notif-read";

// Chave curta de uma notificação (para o cookie de lidas não crescer demais).
export function notificationKey(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Quais estão lidas: clicadas (cookie) ou anteriores ao antigo "lido até".
export async function getReadState() {
  const jar = await cookies();
  const keys = new Set(decodeURIComponent(jar.get(NOTIFICATIONS_READ_COOKIE)?.value ?? "").split(".").filter(Boolean));
  const seenAt = jar.get(NOTIFICATIONS_SEEN_COOKIE)?.value ?? null;
  return (n: Notification) => keys.has(notificationKey(n.id)) || (!!seenAt && n.created_at <= seenAt);
}

// Quantas não lidas (para o número no menu); conta até 99.
export async function countUnreadNotifications(userId: string) {
  const [list, isRead] = await Promise.all([getNotifications(userId, { limit: 99 }), getReadState()]);
  return list.filter((n) => !isRead(n)).length;
}
