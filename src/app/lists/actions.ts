"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDict, getViewer } from "@/lib/session";
import { adultMovieIds, ensureMovie } from "@/lib/catalog";
import { getList, MAX_LIST_ITEMS } from "@/lib/lists";
import { releaseYear, searchMovies, tmdbImage, tmdbLanguage } from "@/lib/tmdb";

// Um filme na janela de criar/editar lista. Do TMDB (tmdbId) ou já no catálogo (itemId, ex.: manual).
export type ListPick = { key: string; tmdbId?: number; itemId?: string; title: string; year: number | null; poster: string | null };

export async function searchMoviesForList(query: string): Promise<ListPick[]> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const [{ locale }, viewer] = await Promise.all([getDict(), getViewer()]);
  try {
    let found = (await searchMovies(q, { language: tmdbLanguage(locale) })).slice(0, 12);
    // Sem +18 ativado, filmes com classificação 18 anos ficam de fora (igual à busca)
    if (!viewer?.show_adult) {
      const adult = await adultMovieIds(found.map((m) => m.id));
      found = found.filter((m) => !adult.has(m.id));
    }
    return found.map((m) => ({
      key: `tmdb-${m.id}`,
      tmdbId: m.id,
      title: m.title,
      year: releaseYear(m),
      poster: tmdbImage(m.poster_path, "w342"),
    }));
  } catch {
    return [];
  }
}

// Itens de uma lista no formato da janela de edição.
export async function getListForEdit(id: string) {
  const viewer = await getViewer();
  const list = await getList(id);
  if (!viewer || !list || list.user_id !== viewer.id) return null;
  const { locale } = await getDict();
  return {
    title: list.title,
    description: list.description ?? "",
    picks: list.items.map((i) => ({
      key: `item-${i.id}`,
      itemId: i.id,
      title: i.translations?.[locale]?.title || i.title,
      year: i.year,
      poster: i.poster_url,
    })) as ListPick[],
  };
}

// Cria (sem id) ou atualiza uma lista; os itens são regravados na ordem recebida.
export async function saveList(input: {
  id?: string;
  title: string;
  description: string;
  picks: ListPick[];
}): Promise<{ id: string | null }> {
  const viewer = await getViewer();
  const title = input.title.trim().slice(0, 100);
  if (!viewer || !title) return { id: null };
  const supabase = await createClient();

  // Filmes do TMDB entram no catálogo (items) se ainda não estiverem lá.
  const picks = input.picks.slice(0, MAX_LIST_ITEMS);
  const itemIds: string[] = [];
  for (const p of picks) {
    if (p.itemId) itemIds.push(p.itemId);
    else if (p.tmdbId) {
      const item = await ensureMovie(p.tmdbId).catch(() => null);
      if (item) itemIds.push(item.id);
    }
  }
  const unique = [...new Set(itemIds)];

  const fields = { title, description: input.description.trim().slice(0, 1000) || null };
  let id = input.id ?? null;
  if (id) {
    const { error } = await supabase.from("lists").update(fields).eq("id", id).eq("user_id", viewer.id);
    if (error) return { id: null };
    await supabase.from("list_items").delete().eq("list_id", id);
  } else {
    const { data, error } = await supabase.from("lists").insert({ ...fields, user_id: viewer.id }).select("id").single();
    if (error || !data) return { id: null };
    id = data.id as string;
  }
  if (unique.length) {
    const { error } = await supabase
      .from("list_items")
      .insert(unique.map((item_id, position) => ({ list_id: id, item_id, position })));
    if (error) return { id: null };
  }
  refresh();
  return { id };
}

export async function deleteList(id: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("lists").delete().eq("id", id).eq("user_id", viewer.id);
  return { ok: !error };
}
