import "server-only";
import { createClient } from "./supabase/server";
import { ensureAnime, ensureBook, ensureGame, ensureManga, ensureMovie, ensureSeries } from "./catalog";
import { trendingBooks } from "./openlibrary";
import { mostPlayedGames } from "./steam";
import { browseAnime, seasonOf } from "./anilist";
import { seasonItems } from "./anime-db";
import { isAnime, tmdbTrendingWeek } from "./tmdb";
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
export async function getFriendsActivity(viewerId: string, limit = 12): Promise<EntryWithAuthor[]> {
  const supabase = await createClient();
  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", viewerId);
  const ids = (follows ?? []).map((f) => f.followee_id as string);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("entries")
    .select(`*, items!inner(*), ${AUTHOR}`)
    .in("user_id", ids)
    .not("rating", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as EntryWithAuthor[];
}

// Populares da semana em uma pasta. Filmes e séries: em alta no mundo todo esta semana (TMDB),
// já que o Orbi ainda tem pouca gente. As outras pastas: os mais adicionados no Orbi na semana.
export async function getPopularItems(kind: MediaKind, limit = 6): Promise<Item[]> {
  if (kind === "anime") {
    // Animes da temporada atual (AniList), dos mais populares para os menos.
    const { season, year } = seasonOf();
    const fromDb = await seasonItems(season, year, limit);
    if (fromDb) return fromDb;
    const { list } = await browseAnime({ page: 1, perPage: limit, sort: "POPULARITY_DESC", season, seasonYear: year });
    const items = await Promise.all(list.map((a) => ensureAnime(a.id).catch(() => null)));
    return items.filter((i): i is Item => !!i);
  }
  if (kind === "manga") {
    // Em alta no AniList agora (o "populares da semana" dos mangás).
    const { list } = await browseAnime({ type: "MANGA", page: 1, perPage: limit * 2, sort: "TRENDING_DESC" });
    const items = await Promise.all(list.filter((m) => !m.isAdult).slice(0, limit).map((m) => ensureManga(m.id).catch(() => null)));
    return items.filter((i): i is Item => !!i);
  }
  if (kind === "book") {
    const books = (await trendingBooks("weekly", limit * 2)).filter((b) => b.cover).slice(0, limit);
    const items = await Promise.all(books.map((b) => ensureBook(b.id).catch(() => null)));
    return items.filter((i): i is Item => !!i);
  }
  if (kind === "game") {
    const games = await mostPlayedGames(limit);
    const items = await Promise.all(games.map((g) => ensureGame(g.id).catch(() => null)));
    return items.filter((i): i is Item => !!i);
  }
  if (kind === "movie" || kind === "series") {
    const type = kind === "series" ? "tv" : "movie";
    const ensure = kind === "series" ? ensureSeries : ensureMovie;
    const trending = (await tmdbTrendingWeek(1, "en-US", type)).results
      .filter((m) => !(type === "tv" && isAnime(m)))
      .slice(0, limit * 2); // folga para os +18 que saem
    const items = await Promise.all(trending.map((m) => ensure(m.id).catch(() => null)));
    return items.filter((i): i is Item => !!i && i.kind === kind && !i.is_adult_rated).slice(0, limit);
  }

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

// Página de uma obra: o que as pessoas que eu sigo registraram nela (nota, like, status), mais recentes primeiro.
export async function getFriendsOnItem(viewerId: string, itemId: string, limit = 24): Promise<EntryWithAuthor[]> {
  const supabase = await createClient();
  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", viewerId);
  const ids = (follows ?? []).map((f) => f.followee_id as string);
  if (!ids.length) return [];
  const { data } = await supabase
    .from("entries")
    .select(`*, items!inner(*), ${AUTHOR}`)
    .eq("item_id", itemId)
    .in("user_id", ids)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as EntryWithAuthor[];
}

// Prateleira pessoal da Home: o que a pessoa tem na watchlist (ou está assistindo/lendo) naquela pasta.
export async function getViewerShelf(
  viewerId: string,
  kind: MediaKind | "all",
  status: "watchlist" | "watching",
  limit = 6,
): Promise<Item[]> {
  const supabase = await createClient();
  let query = supabase
    .from("entries")
    .select("items!inner(*)")
    .eq("user_id", viewerId)
    .eq("status", status);
  // "all": todas as pastas (sem temporadas soltas)
  query = kind === "all" ? query.neq("items.kind", "season") : query.eq("items.kind", kind);
  const { data } = await query
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => row.items as unknown as Item);
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
