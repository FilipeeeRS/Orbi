import "server-only";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { Item, Profile } from "./types";
import { APP_UPDATES, type AppUpdate } from "./updates";

// Notificações montadas a partir do que já existe (sem tabela própria):
// - sociais: curtidas e comentários nas minhas reviews, respostas, curtidas em comentários, novos seguidores;
// - lançamentos: algo da minha watchlist que estreou nos últimos 30 dias;
// - conta: a conta entrou num aparelho/navegador novo (tabela user_devices);
// - novidades do Orbi (lista fixa em lib/updates.ts).
// "Lido até" fica num cookie deste navegador.
export const NOTIFICATIONS_SEEN_COOKIE = "orbi-notifications-seen";

export type NotificationActor = Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
type ItemRef = Pick<Item, "id" | "title" | "translations" | "source" | "external_id" | "year">;

export type NotificationKind = "like" | "comment" | "reply" | "follow" | "commentLike" | "release" | "device" | "update";
export const SOCIAL_KINDS: NotificationKind[] = ["like", "comment", "reply", "follow", "commentLike"];

export type Notification = {
  id: string;
  kind: NotificationKind;
  actor: NotificationActor | null; // null em lançamentos, conta e novidades do Orbi
  created_at: string;
  item: ItemRef | null; // obra da review (curtida, comentário, resposta) ou que estreou
  body: string | null; // texto do comentário, aparelho do novo acesso
  update?: AppUpdate; // novidade do Orbi
};

const ACTOR = "username, display_name, avatar_url, avatar_ring";
const ITEM = "id, kind, title, translations, source, external_id, year";

export async function getNotificationsSeenAt(): Promise<string | null> {
  return (await cookies()).get(NOTIFICATIONS_SEEN_COOKIE)?.value ?? null;
}

export async function getNotifications(userId: string, opts: { since?: string | null; limit?: number } = {}) {
  const limit = opts.limit ?? 50;
  const supabase = await createClient();
  const after = <Q extends { gt: (column: string, value: string) => Q }>(q: Q) => (opts.since ? q.gt("created_at", opts.since) : q);

  const [myReviews, myComments] = await Promise.all([
    supabase.from("entries").select(`id, items!inner(${ITEM})`).eq("user_id", userId).not("review", "is", null).limit(1000),
    supabase.from("review_comments").select("id").eq("user_id", userId).is("deleted_at", null).limit(1000),
  ]);
  const reviewItems = new Map((myReviews.data ?? []).map((e) => [e.id as string, e.items as unknown as ItemRef]));
  const reviewIds = [...reviewItems.keys()];
  const commentIds = (myComments.data ?? []).map((c) => c.id as string);
  const none = Promise.resolve({ data: [] as never[] });

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [likes, comments, replies, follows, commentLikes, releases, devices] = await Promise.all([
    reviewIds.length
      ? after(
          supabase
            .from("review_likes")
            .select(`entry_id, user_id, created_at, actor:profiles!review_likes_user_id_fkey(${ACTOR})`)
            .in("entry_id", reviewIds)
            .neq("user_id", userId),
        )
          .order("created_at", { ascending: false })
          .limit(limit)
      : none,
    reviewIds.length
      ? after(
          supabase
            .from("review_comments")
            .select(`id, entry_id, body, created_at, actor:profiles!review_comments_user_id_fkey(${ACTOR})`)
            .in("entry_id", reviewIds)
            .neq("user_id", userId)
            .is("deleted_at", null),
        )
          .order("created_at", { ascending: false })
          .limit(limit)
      : none,
    commentIds.length
      ? after(
          supabase
            .from("review_comments")
            .select(`id, entry_id, body, created_at, actor:profiles!review_comments_user_id_fkey(${ACTOR}), entry:entries!inner(items!inner(${ITEM}))`)
            .in("parent_id", commentIds)
            .neq("user_id", userId)
            .is("deleted_at", null),
        )
          .order("created_at", { ascending: false })
          .limit(limit)
      : none,
    after(
      supabase
        .from("follows")
        .select(`follower_id, created_at, actor:profiles!follows_follower_id_fkey(${ACTOR})`)
        .eq("followee_id", userId),
    )
      .order("created_at", { ascending: false })
      .limit(limit),
    // Curtidas nos meus comentários
    commentIds.length
      ? after(
          supabase
            .from("comment_likes")
            .select(
              `comment_id, user_id, created_at, actor:profiles!comment_likes_user_id_fkey(${ACTOR}), comment:review_comments!inner(entry:entries!inner(items!inner(${ITEM})))`,
            )
            .in("comment_id", commentIds)
            .neq("user_id", userId),
        )
          .order("created_at", { ascending: false })
          .limit(limit)
      : none,
    // Da minha watchlist, o que estreou nos últimos 30 dias
    supabase
      .from("entries")
      .select(`item_id, items!inner(${ITEM}, release_date)`)
      .eq("user_id", userId)
      .eq("status", "watchlist")
      .gte("items.release_date", opts.since ? opts.since.slice(0, 10) : monthAgo)
      .lte("items.release_date", today)
      .limit(limit),
    // Aparelhos em que a conta entrou (sem a tabela ainda, vem vazio)
    supabase.from("user_devices").select("device_key, label, first_seen").eq("user_id", userId).order("first_seen"),
  ]);

  const list: Notification[] = [];
  for (const r of (releases.data ?? []) as Record<string, unknown>[]) {
    const item = r.items as ItemRef & { release_date: string };
    list.push({ id: `release-${r.item_id}`, kind: "release", actor: null, created_at: `${item.release_date}T12:00:00.000Z`, item, body: null });
  }
  // O primeiro aparelho é o do cadastro; os seguintes são "novo acesso".
  for (const d of ((devices.data ?? []) as { device_key: string; label: string; first_seen: string }[]).slice(1)) {
    if (opts.since && d.first_seen <= opts.since) continue;
    list.push({ id: `device-${d.device_key}`, kind: "device", actor: null, created_at: d.first_seen, item: null, body: d.label });
  }
  for (const u of APP_UPDATES) {
    const at = `${u.date}T12:00:00.000Z`;
    if (opts.since && at <= opts.since) continue;
    list.push({ id: `update-${u.id}`, kind: "update", actor: null, created_at: at, item: null, body: null, update: u });
  }
  const seenComments = new Set<string>();
  // Resposta a um comentário meu conta como "respondeu", mesmo se for na minha própria review.
  for (const r of (replies.data ?? []) as Record<string, unknown>[]) {
    seenComments.add(r.id as string);
    const entry = r.entry as { items: ItemRef } | null;
    list.push({ id: `reply-${r.id}`, kind: "reply", actor: r.actor as NotificationActor, created_at: r.created_at as string, item: entry?.items ?? null, body: r.body as string });
  }
  for (const c of (comments.data ?? []) as Record<string, unknown>[]) {
    if (seenComments.has(c.id as string)) continue;
    list.push({ id: `comment-${c.id}`, kind: "comment", actor: c.actor as NotificationActor, created_at: c.created_at as string, item: reviewItems.get(c.entry_id as string) ?? null, body: c.body as string });
  }
  for (const l of (likes.data ?? []) as Record<string, unknown>[]) {
    list.push({ id: `like-${l.entry_id}-${l.user_id}`, kind: "like", actor: l.actor as NotificationActor, created_at: l.created_at as string, item: reviewItems.get(l.entry_id as string) ?? null, body: null });
  }
  for (const l of (commentLikes.data ?? []) as Record<string, unknown>[]) {
    const comment = l.comment as { entry: { items: ItemRef } } | null;
    list.push({ id: `clike-${l.comment_id}-${l.user_id}`, kind: "commentLike", actor: l.actor as NotificationActor, created_at: l.created_at as string, item: comment?.entry?.items ?? null, body: null });
  }
  for (const f of (follows.data ?? []) as Record<string, unknown>[]) {
    list.push({ id: `follow-${f.follower_id}`, kind: "follow", actor: f.actor as NotificationActor, created_at: f.created_at as string, item: null, body: null });
  }

  return list
    .filter((n) => n.actor || !SOCIAL_KINDS.includes(n.kind))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

// Quantas não lidas (para o número no menu); conta até 99.
export async function countUnreadNotifications(userId: string) {
  const since = await getNotificationsSeenAt();
  return (await getNotifications(userId, { since, limit: 99 })).length;
}
