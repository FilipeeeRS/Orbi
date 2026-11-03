"use server";

import { cacheLife } from "next/cache";
import { getDict } from "@/lib/session";
import { TMDB_LANGUAGES } from "@/lib/i18n/dictionaries";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { overIpLimit } from "@/lib/rate-limit";

type Translation = { text: string; from: string };

// MyMemory: API pública e gratuita, com detecção do idioma. Aceita até 500 bytes por pedido, então o
// texto vai em pedaços (quebrados entre palavras). Com um e-mail de contato no "de" o limite
// diário sobe de 5 mil para 50 mil caracteres.
const MAX_BYTES = 450;

function chunks(text: string) {
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  const out: string[] = [];
  let current = "";
  // Cada pedaço é uma palavra com o espaço que vem depois (o texto se remonta igual)
  for (const piece of text.split(/(?<=\s)/)) {
    if (bytes(current + piece) > MAX_BYTES && current) {
      out.push(current);
      current = "";
    }
    // Um pedaço sozinho maior que o limite (sem espaços) é cortado no meio
    let rest = piece;
    while (bytes(rest) > MAX_BYTES) {
      let cut = rest.length;
      while (bytes(rest.slice(0, cut)) > MAX_BYTES) cut--;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    current += rest;
  }
  if (current.trim()) out.push(current);
  return out;
}

async function myMemory(text: string, target: string): Promise<Translation> {
  const url = new URL("https://api.mymemory.translated.net/get");
  const params = new URLSearchParams({ q: text, langpair: `Autodetect|${target}` });
  if (!CONTACT_EMAIL.endsWith("@example.com")) params.set("de", CONTACT_EMAIL);
  url.search = params.toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = (await res.json()) as {
    responseStatus: number | string;
    responseDetails?: string;
    responseData: { translatedText: string; detectedLanguage?: string };
  };
  // Texto já no idioma de destino: a API recusa ("PLEASE SELECT TWO DISTINCT LANGUAGES")
  if (/DISTINCT LANGUAGES/i.test(data.responseDetails ?? "")) return { text, from: target };
  if (Number(data.responseStatus) !== 200) throw new Error(`mymemory ${data.responseStatus}`);
  return { text: data.responseData.translatedText, from: data.responseData.detectedLanguage ?? "" };
}

// Só respostas de verdade ficam em cache (um erro sobe e nada é guardado).
async function translate(text: string, target: string): Promise<Translation> {
  "use cache";
  cacheLife("weeks");
  const parts = await Promise.all(chunks(text).map((c) => myMemory(c, target)));
  return { text: parts.map((p) => p.text).join(" "), from: parts[0]?.from ?? "" };
}

// Traduz para o idioma do site. sameLanguage = o texto já estava nesse idioma.
export async function translateText(text: string): Promise<{ text: string; sameLanguage: boolean } | null> {
  const clean = text.trim().slice(0, 5000);
  // No máximo 20 traduções por minuto por endereço (a cota diária do MyMemory é do site inteiro)
  if (!clean || (await overIpLimit("translate", 20, 60))) return null;
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
