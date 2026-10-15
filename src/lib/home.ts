import "server-only";
import { createClient } from "./supabase/server";
import type { EntryWithItem, Item, MediaKind, Profile } from "./types";

// Dados da tela inicial (Home) de quem está logado. Tudo respeita a RLS:
// perfis invisíveis e as entradas deles nunca aparecem para outras pessoas.

export type Author = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
export type EntryWithAuthor = EntryWithItem & { profiles: Author };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const weekAgo = () => new Date(Date.now() - WEEK_MS).toISOString();
// Amostra máxima lida para calcular popularidade (suficiente enquanto o Orbi é pequeno).
const SAMPLE = 2000;

// FK explícita: com review_likes existe outro caminho entre entries e profiles.
const AUTHOR = "profiles!entries_user_id_fkey!inner(id, username, display_name, avatar_url)";

// Últimas coisas que as pessoas que eu sigo adicionaram, da mais recente para a mais antiga.
export async function getFriendsActivity(viewerId: string, limit = 6): Promise<EntryWithAuthor[]> {
  const supabase = await createClient();
  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", viewerId);
  const ids = (follows ?? []).map((f) => f.followee_id as string);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("entries")
    .select(`*, items!inner(*), ${AUTHOR}`)
    .in("user_id", ids)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as EntryWithAuthor[];
}

// Itens mais adicionados na semana em uma pasta; completa com os mais populares de sempre.
export async function getPopularItems(kind: MediaKind, limit = 6): Promise<Item[]> {
  const supabase = await createClient();
  const sample = (since?: string) => {
    let q = supabase.from("entries").select("item_id, items!inner(*)").eq("items.kind", kind);
    if (since) q = q.gte("created_at", since);
    return q.order("created_at", { ascending: false }).limit(SAMPLE);
  };

  const rank = (rows: { item_id: string; items: unknown }[]) => {
    const counts = new Map<string, { item: Item; n: number }>();
    for (const row of rows) {
      const current = counts.get(row.item_id);
      if (current) current.n++;
      else counts.set(row.item_id, { item: row.items as Item, n: 1 });
    }
    return [...counts.values()].sort((a, b) => b.n - a.n).map((c) => c.item);
  };

  const week = rank(((await sample(weekAgo())).data ?? []) as { item_id: string; items: unknown }[]);
  if (week.length >= limit) return week.slice(0, limit);

  const seen = new Set(week.map((i) => i.id));
  const allTime = rank(((await sample()).data ?? []) as { item_id: string; items: unknown }[]).filter(
    (i) => !seen.has(i.id),
  );
  return [...week, ...allTime].slice(0, limit);
}

// Reviews mais recentes da semana (ainda não há like em review); completa com as mais recentes de sempre.
export async function getPopularReviews(limit = 6): Promise<EntryWithAuthor[]> {
  const supabase = await createClient();
  const query = () =>
    supabase
      .from("entries")
      .select(`*, items!inner(*), ${AUTHOR}`)
      .not("review", "is", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

  const week = ((await query().gte("updated_at", weekAgo())).data ?? []) as unknown as EntryWithAuthor[];
  if (week.length >= limit) return week;
  const seen = new Set(week.map((e) => e.id));
  const recent = ((await query()).data ?? []) as unknown as EntryWithAuthor[];
  return [...week, ...recent.filter((e) => !seen.has(e.id))].slice(0, limit);
}

// Ordem das pastas na Home: pela proporção de cada tipo nas últimas 10 adições do usuário.
// Empates (e quem ainda não adicionou nada) seguem a ordem padrão.
export async function getKindOrderForViewer(viewerId: string, kinds: MediaKind[]): Promise<MediaKind[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select("items!inner(kind)")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(10);
  const counts = new Map<MediaKind, number>();
  for (const row of data ?? []) {
    const kind = (row.items as unknown as { kind: MediaKind }).kind;
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return kinds
    .map((kind, i) => ({ kind, n: counts.get(kind) ?? 0, i }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((k) => k.kind);
}
