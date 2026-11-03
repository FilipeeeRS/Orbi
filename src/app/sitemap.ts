import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/share";

// Mapa do site para os buscadores: as páginas fixas, as listagens de cada pasta e as listas das pessoas
// (de perfis visíveis). As obras são achadas a partir dessas páginas.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/home", "/lists", "/search", "/about", "/privacy", "/terms", "/cookies", "/anime/season"];
  const browse = ["movies", "series", "books", "anime", "manga", "games"].map((f) => `/browse/${f}`);
  const { data } = await createAdminClient()
    .from("lists")
    .select("id, updated_at, owner:profiles!lists_user_id_fkey!inner(username, is_private)")
    .eq("owner.is_private", false)
    .order("updated_at", { ascending: false })
    .limit(5000);
  const lists = ((data ?? []) as unknown as { id: string; updated_at: string; owner: { username: string } }[]).map((l) => ({
    url: `${SITE_URL}/u/${l.owner.username}/list/${l.id}`,
    lastModified: l.updated_at,
  }));
  return [...[...fixed, ...browse].map((path) => ({ url: `${SITE_URL}${path}` })), ...lists];
}
