import "server-only";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

// Pessoas do Orbi: busca por nome/@ e sugestões de quem seguir. A RLS já esconde perfis invisíveis.
export type PersonCard = Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "avatar_ring" | "bio"> & {
  followers: number;
  following: boolean; // quem está vendo já segue
};

const FIELDS = "id, username, display_name, avatar_url, avatar_ring, bio";

// Quantos seguidores cada um tem e quem dessa lista quem está vendo já segue.
async function withFollows(people: Omit<PersonCard, "followers" | "following">[], viewerId: string | null): Promise<PersonCard[]> {
  if (!people.length) return [];
  const supabase = await createClient();
  const ids = people.map((p) => p.id);
  const [{ data: followers }, { data: mine }] = await Promise.all([
    supabase.from("follows").select("followee_id").in("followee_id", ids).limit(20000),
    viewerId ? supabase.from("follows").select("followee_id").eq("follower_id", viewerId).in("followee_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const count = new Map<string, number>();
  for (const f of followers ?? []) count.set(f.followee_id, (count.get(f.followee_id) ?? 0) + 1);
  const following = new Set((mine ?? []).map((f) => f.followee_id));
  return people.map((p) => ({ ...p, followers: count.get(p.id) ?? 0, following: following.has(p.id) }));
}

// Busca por nome ou @usuário (com ou sem o @).
export async function searchPeople(q: string, viewerId: string | null, limit = 40): Promise<PersonCard[]> {
  const text = q.trim().replace(/^@/, "").slice(0, 50).replace(/[%,()*]/g, " ").trim();
  if (!text) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(FIELDS)
    .or(`username.ilike.%${text}%,display_name.ilike.%${text}%`)
    .limit(limit);
  const people = await withFollows((data ?? []) as Omit<PersonCard, "followers" | "following">[], viewerId);
  // Quem tem o nome exato primeiro; depois os mais seguidos
  const exact = text.toLowerCase();
  return people.sort(
    (a, b) => Number(b.username === exact) - Number(a.username === exact) || b.followers - a.followers,
  );
}

// Quem seguir: os mais seguidos que a pessoa ainda não segue; completa com quem chegou por último.
export async function whoToFollow(viewerId: string, limit = 6): Promise<PersonCard[]> {
  const supabase = await createClient();
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from("follows").select("followee_id").limit(20000),
    supabase.from("follows").select("followee_id").eq("follower_id", viewerId),
  ]);
  const skip = new Set([viewerId, ...(mine ?? []).map((f) => f.followee_id)]);
  const count = new Map<string, number>();
  for (const f of all ?? []) if (!skip.has(f.followee_id)) count.set(f.followee_id, (count.get(f.followee_id) ?? 0) + 1);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);

  const { data: popular } = top.length ? await supabase.from("profiles").select(FIELDS).in("id", top) : { data: [] };
  let people = (popular ?? []) as Omit<PersonCard, "followers" | "following">[];
  if (people.length < limit) {
    const { data: recent } = await supabase
      .from("profiles")
      .select(FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit * 3);
    for (const p of (recent ?? []) as Omit<PersonCard, "followers" | "following">[]) {
      if (people.length >= limit) break;
      if (!skip.has(p.id) && !people.some((x) => x.id === p.id)) people.push(p);
    }
  }
  people = people.slice(0, limit);
  return (await withFollows(people, viewerId)).sort((a, b) => b.followers - a.followers);
}
