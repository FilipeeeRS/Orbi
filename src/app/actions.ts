"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

export type ProfileFormState = { status: "idle" | "saved" | "taken" | "invalid" | "error"; username?: string };

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
  refresh();
  return { status: "saved", username };
}
