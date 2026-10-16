"use server";

import { cacheLife } from "next/cache";
import { getDict } from "@/lib/session";
import { TMDB_LANGUAGES } from "@/lib/i18n/dictionaries";

type Translation = { text: string; from: string };

// Google Translate, endpoint público sem chave (o da extensão do Chrome). O "client=gtx" responde
// 429 para pedidos vindos do Node, este não. Devolve [[tradução, idioma de origem]].
async function google(text: string, target: string): Promise<Translation> {
  const url = new URL("https://translate.googleapis.com/translate_a/t");
  url.search = new URLSearchParams({ client: "dict-chrome-ex", sl: "auto", tl: target, q: text }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`google ${res.status}`);
  const [[translated, from]] = (await res.json()) as [[string, string]];
  return { text: translated, from };
}

// Reserva: MyMemory (gratuito, também detecta o idioma).
async function myMemory(text: string, target: string): Promise<Translation> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.search = new URLSearchParams({ q: text, langpair: `Autodetect|${target}` }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = (await res.json()) as { responseData: { translatedText: string; detectedLanguage?: string } };
  return { text: data.responseData.translatedText, from: data.responseData.detectedLanguage ?? "" };
}

// Só respostas de verdade ficam em cache (um erro sobe e nada é guardado).
async function translate(text: string, target: string): Promise<Translation> {
  "use cache";
  cacheLife("weeks");
  try {
    return await google(text, target);
  } catch {
    return await myMemory(text, target);
  }
}

// Traduz para o idioma do site. sameLanguage = o texto já estava nesse idioma.
// Para produção, vale trocar por uma API com chave (Google Cloud Translation, DeepL...).
export async function translateText(text: string): Promise<{ text: string; sameLanguage: boolean } | null> {
  const clean = text.trim().slice(0, 5000);
  if (!clean) return null;
  const { locale } = await getDict();
  // zh → zh-CN; os outros usam só o código do idioma
  const target = locale === "zh" ? TMDB_LANGUAGES.zh : locale;
  try {
    const result = await translate(clean, target);
    return { text: result.text, sameLanguage: result.from.toLowerCase().startsWith(locale) };
  } catch (e) {
    console.error("[translate]", e);
    return null;
  }
}
