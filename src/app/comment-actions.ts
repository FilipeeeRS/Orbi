"use server";

import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/session";
import type { Profile } from "@/lib/types";

export type ReviewComment = {
  id: string;
  entry_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  deleted_at: string | null; // apagado mas com respostas: aparece como "Comentário apagado"
  likes: number; // curtidas no comentário
  liked: boolean; // quem está vendo já curtiu
  author: Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
};

const SELECT =
  "id, entry_id, user_id, parent_id, body, created_at, deleted_at, author:profiles!review_comments_user_id_fkey(username, display_name, avatar_url, avatar_ring)";

// Conversa de uma review, da mais antiga para a mais nova (as respostas são organizadas na tela).
export async function listReviewComments(entryId: string): Promise<ReviewComment[]> {
  const [supabase, viewer] = await Promise.all([createClient(), getViewer()]);
  const { data } = await supabase
    .from("review_comments")
    .select(SELECT)
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true })
    .limit(500);
  const comments = (data ?? []) as unknown as Omit<ReviewComment, "likes" | "liked">[];

  // Curtidas: quantas cada comentário tem e quais quem está vendo já curtiu
  const { data: likes } = comments.length
    ? await supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", comments.map((c) => c.id))
    : { data: [] };
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const l of likes ?? []) {
    counts.set(l.comment_id, (counts.get(l.comment_id) ?? 0) + 1);
    if (l.user_id === viewer?.id) mine.add(l.comment_id);
  }
  return comments.map((c) => ({ ...c, likes: counts.get(c.id) ?? 0, liked: mine.has(c.id) }));
}

// Curtir / descurtir um comentário
export async function setCommentLike(commentId: string, like: boolean): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const supabase = await createClient();
  const { error } = like
    ? await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: viewer.id })
    : await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", viewer.id);
  // Curtir de novo o que já estava curtido (duplicado) não é erro
  return { ok: !error || error.code === "23505" };
}

export async function addReviewComment(
  entryId: string,
  body: string,
  parentId: string | null,
): Promise<{ comment: ReviewComment | null }> {
  const viewer = await getViewer();
  const text = body.trim().slice(0, 2000);
  // Precisa ter algo além de menções ("@fulano" sozinho não vale)
  if (!viewer || !text.replace(/@[a-z0-9_]+/gi, "").trim()) return { comment: null };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_comments")
    .insert({ entry_id: entryId, user_id: viewer.id, parent_id: parentId, body: text })
    .select(SELECT)
    .single();
  if (error) return { comment: null };
  return { comment: { ...(data as unknown as ReviewComment), likes: 0, liked: false } };
}

// Com respostas vira "apagado" (soft); sem respostas some (hard). A regra fica no banco (delete_review_comment).
export async function deleteReviewComment(id: string): Promise<{ mode: "soft" | "hard" | null }> {
  const viewer = await getViewer();
  if (!viewer) return { mode: null };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_review_comment", { comment_id: id });
  return { mode: error ? null : ((data as "soft" | "hard" | null) ?? null) };
}
