"use server";

import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/session";
import type { Profile } from "@/lib/types";

export type ListComment = {
  id: string;
  list_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: Pick<Profile, "username" | "display_name" | "avatar_url" | "avatar_ring">;
};

const SELECT = "id, list_id, user_id, body, created_at, author:profiles!list_comments_user_id_fkey(username, display_name, avatar_url, avatar_ring)";

// Curtir / descurtir uma lista (curtir de novo o que já estava curtido não é erro).
export async function setListLike(listId: string, like: boolean): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const supabase = await createClient();
  const { error } = like
    ? await supabase.from("list_likes").insert({ list_id: listId, user_id: viewer.id })
    : await supabase.from("list_likes").delete().eq("list_id", listId).eq("user_id", viewer.id);
  return { ok: !error || error.code === "23505" };
}

export async function addListComment(listId: string, body: string): Promise<{ comment: ListComment | null }> {
  const viewer = await getViewer();
  const text = body.trim().slice(0, 2000);
  if (!viewer || !text) return { comment: null };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("list_comments")
    .insert({ list_id: listId, user_id: viewer.id, body: text })
    .select(SELECT)
    .single();
  if (error) return { comment: null };
  return { comment: data as unknown as ListComment };
}

// Apaga o próprio comentário (ou qualquer um, se a lista for sua): a regra fica na RLS.
export async function deleteListComment(id: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const supabase = await createClient();
  const { error, count } = await supabase.from("list_comments").delete({ count: "exact" }).eq("id", id);
  return { ok: !error && (count ?? 0) > 0 };
}
