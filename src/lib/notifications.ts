import "server-only";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { Item, Profile } from "./types";

// Notificações montadas a partir do que já existe (sem tabela própria):
// curtidas e comentários nas minhas reviews, respostas aos meus comentários e novos seguidores.
// "Lido até" fica num cookie deste navegador.
export const NOTIFICATIONS_SEEN_COOKIE = "orbi-notifications-seen";

export type NotificationActor = Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
type ItemRef = Pick<Item, "id" | "title" | "translations" | "source" | "external_id" | "year">;

export type Notification = {
  id: string;
  kind: "like" | "comment" | "reply" | "follow" | "commentLike";
  actor: NotificationActor;
  created_at: string;
  item: ItemRef | null; // obra da review (curtida, comentário, resposta)
  body: string | null; // texto do comentário
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

  const [likes, comments, replies, follows, commentLikes] = await Promise.all([
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
  ]);

  const list: Notification[] = [];
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
    .filter((n) => n.actor)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

// Quantas não lidas (para o número no menu); conta até 99.
export async function countUnreadNotifications(userId: string) {
  const since = await getNotificationsSeenAt();
  return (await getNotifications(userId, { since, limit: 99 })).length;
}
