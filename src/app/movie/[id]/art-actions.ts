"use server";

import { refresh } from "next/cache";
import { ART_PATH } from "@/lib/art";
import { createClient } from "@/lib/supabase/server";
import { getDict, getViewer } from "@/lib/session";
import { getMovieImages, tmdbLanguage } from "@/lib/tmdb";

// Imagens do TMDB disponíveis para o filme ou série (só os do TMDB; os manuais não têm alternativas).
export async function listMovieImages(itemId: string): Promise<{ posters: string[]; backdrops: string[] }> {
  const supabase = await createClient();
  const { data: item } = await supabase.from("items").select("kind, source, external_id").eq("id", itemId).maybeSingle();
  if (!item || item.source !== "tmdb" || !item.external_id) return { posters: [], backdrops: [] };
  const { locale } = await getDict();
  try {
    return await getMovieImages(Number(item.external_id), tmdbLanguage(locale), item.kind === "series" ? "tv" : "movie");
  } catch {
    return { posters: [], backdrops: [] };
  }
}

// Grava o pôster ou o fundo escolhido (caminho do TMDB); null volta para o padrão.
// Vale para qualquer filme ou série, mesmo sem ter assistido.
export async function saveItemArt(itemId: string, kind: "poster" | "backdrop", path: string | null): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || (path !== null && !ART_PATH.test(path))) return { ok: false };
  const supabase = await createClient();
  const column = kind === "poster" ? "poster_path" : "backdrop_path";

  const { data: current } = await supabase
    .from("item_art")
    .select("poster_path, backdrop_path")
    .eq("user_id", viewer.id)
    .eq("item_id", itemId)
    .maybeSingle();
  const next = { poster_path: current?.poster_path ?? null, backdrop_path: current?.backdrop_path ?? null, [column]: path };

  // Sem nenhuma escolha, a linha some (tudo volta ao padrão).
  const { error } =
    next.poster_path || next.backdrop_path
      ? await supabase
          .from("item_art")
          .upsert({ user_id: viewer.id, item_id: itemId, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id,item_id" })
      : await supabase.from("item_art").delete().eq("user_id", viewer.id).eq("item_id", itemId);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
