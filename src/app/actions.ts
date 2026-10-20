"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDict, getViewer, LOCALE_COOKIE } from "@/lib/session";
import { itemTitle, type Item } from "@/lib/types";
import { isLocale } from "@/lib/i18n/dictionaries";
import { isAvatarRing } from "@/lib/avatar-ring";
import { ensureAnime, ensureBook, ensureGame, ensureManga, ensureMovie, ensureSeason, ensureSeries } from "@/lib/catalog";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  const viewer = await getViewer();
  if (viewer) {
    const supabase = await createClient();
    await supabase.from("profiles").update({ locale }).eq("id", viewer.id);
  }
  refresh();
}

// "meusite.com" vira "https://meusite.com"; qualquer coisa que não seja http/https é recusada (false).
function normalizeWebsite(raw: string): string | null | false {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return false;
    const href = url.toString();
    return href.length <= 200 ? href : false;
  } catch {
    return false;
  }
}

export type ProfileFormState = { status: "idle" | "taken" | "invalid" | "error" };

export async function updateProfile(_prev: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error" };

  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("display_name") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const location = String(form.get("location") ?? "").trim();
  const website = normalizeWebsite(String(form.get("website") ?? ""));
  const pronouns = String(form.get("pronouns") ?? "").trim();
  const isPrivate = form.get("is_private") === "on";
  const showAdult = form.get("show_adult") === "on";
  const locale = String(form.get("locale") ?? "");

  if (!/^[a-z0-9_]{3,30}$/.test(username) || displayName.length > 60 || bio.length > 500 || location.length > 60 || pronouns.length > 30 || website === false || !isLocale(locale)) {
    return { status: "invalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio: bio || null,
      location: location || null,
      website: website || null,
      pronouns: pronouns || null,
      is_private: isPrivate,
      show_adult: showAdult,
      locale,
    })
    .eq("id", viewer.id);

  if (error) return { status: error.code === "23505" ? "taken" : "error" };

  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect(`/u/${username}`);
}

// Foto, capa e sticker vão para o Storage pelo navegador (pasta do próprio usuário); aqui só gravamos a URL.
const IMAGE_COLUMNS = { avatar: "avatar_url", cover: "cover_url", sticker: "sticker_url" } as const;

async function setProfileImage(kind: keyof typeof IMAGE_COLUMNS, path: string | null): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (path !== null && !path.startsWith(`${viewer.id}/${kind}-`)) return { ok: false };

  const supabase = await createClient();
  const url = path ? supabase.storage.from("posters").getPublicUrl(path).data.publicUrl : null;
  const column = IMAGE_COLUMNS[kind];
  const { error } = await supabase.from("profiles").update({ [column]: url }).eq("id", viewer.id);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

export async function setAvatar(path: string | null) {
  return setProfileImage("avatar", path);
}

export async function setCover(path: string | null) {
  return setProfileImage("cover", path);
}

export async function setSticker(path: string | null) {
  return setProfileImage("sticker", path);
}

export async function setAvatarRing(ring: string): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || !isAvatarRing(ring)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_ring: ring }).eq("id", viewer.id);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

// Login por e-mail ou nome de usuário. O e-mail de quem usa o @ é resolvido aqui no servidor
// e nunca volta para o navegador (não dá para descobrir o e-mail de ninguém pelo usuário).
export async function signInWithIdentifier(identifier: string, password: string): Promise<{ ok: boolean }> {
  const id = identifier.trim();
  let email = id;

  if (!id.includes("@")) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", id.toLowerCase().replace(/^@/, ""))
      .maybeSingle();
    if (!profile) return { ok: false };
    const { data } = await admin.auth.admin.getUserById(profile.id);
    if (!data.user?.email) return { ok: false };
    email = data.user.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { ok: !error };
}

// ---- Filmes favoritos do perfil (Configurações) ----

export type FavoriteItem = { id: string; title: string; poster_url: string | null };
export type FavoriteCandidate = FavoriteItem & { year: number | null };

// Busca só entre os filmes que o usuário curtiu (título em inglês, original ou traduzido).
export async function searchFavoriteCandidates(query: string): Promise<FavoriteCandidate[]> {
  const q = query.trim().slice(0, 100).replace(/[%,()]/g, " ");
  const viewer = await getViewer();
  if (q.length < 2 || !viewer) return [];
  const { locale } = await getDict();
  const supabase = await createClient();
  const pattern = `%${q}%`;
  const { data } = await supabase
    .from("entries")
    .select("items!inner(id, title, year, poster_url, translations)")
    .eq("user_id", viewer.id)
    .eq("liked", true)
    .or(
      `title.ilike.${pattern},original_title.ilike.${pattern},translations->${locale}->>title.ilike.${pattern}`,
      { referencedTable: "items" },
    )
    .limit(8);
  return (data ?? []).map((row) => {
    const item = row.items as unknown as Item;
    return { id: item.id, title: itemTitle(item, locale), year: item.year, poster_url: item.poster_url };
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveFavorites(itemIds: string[]): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  const ids = [...new Set(itemIds)].filter((id) => UUID.test(id)).slice(0, 4);
  if (!viewer) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ favorites: ids }).eq("id", viewer.id);
  // Limpa o cache de navegação para o perfil e as configurações mostrarem a lista nova.
  if (!error) refresh();
  return { ok: !error };
}

// Atalhos do pôster em listas de fora (filme/série do TMDB, anime do AniList) que talvez ainda não
// estejam no catálogo: cria e devolve o id.
export async function ensureTmdbItemId(
  type: "movie" | "tv" | "anime" | "manga" | "book" | "game",
  id: number | string,
): Promise<string | null> {
  if (!(await getViewer())) return null;
  // Livro: id da Open Library ("OL45804W"); o resto: número.
  if (type === "book") return typeof id === "string" ? ((await ensureBook(id))?.id ?? null) : null;
  if (typeof id !== "number" || !Number.isInteger(id)) return null;
  if (type === "game") return (await ensureGame(id))?.id ?? null;
  const ensure = type === "manga" ? ensureManga : type === "anime" ? ensureAnime : type === "tv" ? ensureSeries : ensureMovie;
  return (await ensure(id))?.id ?? null;
}

// Episódios marcados na página da série: a temporada vira item no catálogo no primeiro clique.
export async function ensureSeasonId(showTmdbId: number, season: number): Promise<string | null> {
  if (!(await getViewer()) || !Number.isInteger(showTmdbId) || !Number.isInteger(season)) return null;
  return (await ensureSeason(showTmdbId, season))?.season.id ?? null;
}
