import "server-only";
import { createClient } from "./supabase/server";
import { tmdbImage } from "./tmdb";
import type { EntryWithItem, Item } from "./types";

// Pôster e fundo que cada pessoa escolheu para uma obra (tabela item_art), já como URL.
// É pessoal: só quem escolheu vê (em qualquer lugar do site); os outros veem o padrão.
export type ItemArt = { poster: string | null; backdrop: string | null };

export const ART_PATH = /^\/[A-Za-z0-9_-]+\.(jpg|png)$/;

export async function getArt(userId: string, itemIds: string[]): Promise<Map<string, ItemArt>> {
  const art = new Map<string, ItemArt>();
  const ids = [...new Set(itemIds)];
  if (!ids.length) return art;
  const supabase = await createClient();
  const { data } = await supabase
    .from("item_art")
    .select("item_id, poster_path, backdrop_path")
    .eq("user_id", userId)
    .in("item_id", ids);
  for (const row of data ?? []) {
    art.set(row.item_id, {
      poster: tmdbImage(row.poster_path, "w500"),
      backdrop: tmdbImage(row.backdrop_path, "w1280"),
    });
  }
  return art;
}

// Troca o pôster/fundo dos itens pelos escolhidos por quem está vendo (sem mexer no original).
export function withArt<T extends Item>(item: T, art: ItemArt | undefined): T {
  if (!art) return item;
  return { ...item, poster_url: art.poster ?? item.poster_url, backdrop_url: art.backdrop ?? item.backdrop_url };
}

export async function applyArtToItems<T extends Item>(userId: string, items: T[]): Promise<T[]> {
  const art = await getArt(userId, items.map((i) => i.id));
  return items.map((i) => withArt(i, art.get(i.id)));
}

export async function applyArtToEntries<T extends EntryWithItem>(userId: string, entries: T[]): Promise<T[]> {
  const art = await getArt(userId, entries.map((e) => e.item_id));
  return entries.map((e) => ({ ...e, items: withArt(e.items, art.get(e.item_id)) }));
}
