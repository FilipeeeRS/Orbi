import { pt, type Dictionary } from "./locales/pt";
import { en } from "./locales/en";
import { zh } from "./locales/zh";
import { hi } from "./locales/hi";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { ar } from "./locales/ar";
import { bn } from "./locales/bn";
import { ru } from "./locales/ru";
import { ur } from "./locales/ur";
import { id } from "./locales/id";
import { de } from "./locales/de";
import { ja } from "./locales/ja";
import { tr } from "./locales/tr";
import { ko } from "./locales/ko";
import { it } from "./locales/it";

export type { Dictionary };

export const LOCALES = ["pt", "en", "zh", "hi", "es", "fr", "ar", "bn", "ru", "ur", "id", "de", "ja", "tr", "ko", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  zh: "中文",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  bn: "বাংলা",
  ru: "Русский",
  ur: "اردو",
  id: "Bahasa Indonesia",
  de: "Deutsch",
  ja: "日本語",
  tr: "Türkçe",
  ko: "한국어",
  it: "Italiano",
};

// Ordem dos seletores de idioma: alfabética pelo nome no próprio idioma (alfabeto latino primeiro,
// depois cirílico, árabe, devanágari, bengali, chinês, japonês e coreano). Fixa para o servidor e o
// navegador ordenarem igual.
export const LOCALES_ALPHABETICAL: readonly Locale[] = ["id", "de", "en", "es", "fr", "it", "pt", "tr", "ru", "ar", "ur", "hi", "bn", "zh", "ja", "ko"];

// Idioma/região usados nas buscas do TMDB e para escolher a tradução preferida.
export const TMDB_LANGUAGES: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en-US",
  zh: "zh-CN",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  ar: "ar-SA",
  bn: "bn-BD",
  ru: "ru-RU",
  ur: "ur-PK",
  id: "id-ID",
  de: "de-DE",
  ja: "ja-JP",
  tr: "tr-TR",
  ko: "ko-KR",
  it: "it-IT",
};

export const dictionaries: Record<Locale, Dictionary> = { pt, en, zh, hi, es, fr, ar, bn, ru, ur, id, de, ja, tr, ko, it };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// "pt-BR,pt;q=0.9,en;q=0.8" → primeiro idioma suportado da lista
export function localeFromAcceptLanguage(header: string): Locale | null {
  for (const part of header.split(",")) {
    const lang = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }
  return null;
}
