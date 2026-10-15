import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "./supabase/server";
import { dictionaries, isLocale, localeFromAcceptLanguage, type Locale } from "./i18n/dictionaries";
import type { Profile } from "./types";

export const LOCALE_COOKIE = "orbi_locale";

export const getViewer = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return (profile as Profile | null) ?? null;
});

// Idioma: o do perfil > o escolhido no cookie > o do navegador.
export const getLocale = cache(async (): Promise<Locale> => {
  const viewer = await getViewer();
  if (viewer?.locale) return viewer.locale;

  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language");
  if (!accept) return "pt";
  return localeFromAcceptLanguage(accept) ?? "en";
});

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
