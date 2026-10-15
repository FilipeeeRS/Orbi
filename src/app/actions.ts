"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer, LOCALE_COOKIE } from "@/lib/session";
import { isLocale } from "@/lib/i18n/dictionaries";

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

export type ProfileFormState = { status: "idle" | "taken" | "invalid" | "error" };

export async function updateProfile(_prev: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error" };

  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("display_name") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const locale = String(form.get("locale") ?? "");

  if (!/^[a-z0-9_]{3,30}$/.test(username) || displayName.length > 60 || bio.length > 500 || !isLocale(locale)) {
    return { status: "invalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username, display_name: displayName || null, bio: bio || null, locale })
    .eq("id", viewer.id);

  if (error) return { status: error.code === "23505" ? "taken" : "error" };

  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect(`/u/${username}`);
}

// A foto vai para o Storage pelo navegador (pasta do próprio usuário); aqui só gravamos a URL.
export async function setAvatar(path: string | null): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false };
  if (path !== null && !path.startsWith(`${viewer.id}/avatar-`)) return { ok: false };

  const supabase = await createClient();
  const avatarUrl = path ? supabase.storage.from("posters").getPublicUrl(path).data.publicUrl : null;
  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", viewer.id);
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
