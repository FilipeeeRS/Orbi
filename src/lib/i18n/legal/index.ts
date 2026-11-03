import "server-only";
import type { Locale } from "../dictionaries";

// Privacidade, Termos e Cookies: textos longos que só as próprias páginas usam, por isso ficam fora do
// dicionário (que vai inteiro para o navegador) e são carregados só no idioma pedido.
// Marcas aceitas nos textos: {email}, {privacy}, {terms}, {cookies} e {settings} viram links/nomes.
export type LegalSection = {
  id: string;
  title: string;
  body: string[];
  list?: string[];
  // Pares [nome, para que serve], como a tabela de cookies
  items?: [string, string][];
};
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };
export type LegalTexts = { privacy: LegalDoc; terms: LegalDoc; cookies: LegalDoc };

// Data da versão em vigor (muda junto com o texto)
export const LEGAL_UPDATED = "2026-11-03";

const LOADERS: Record<Locale, () => Promise<{ default: LegalTexts }>> = {
  pt: () => import("./pt"),
  en: () => import("./en"),
  zh: () => import("./zh"),
  hi: () => import("./hi"),
  es: () => import("./es"),
  fr: () => import("./fr"),
  ar: () => import("./ar"),
  bn: () => import("./bn"),
  ru: () => import("./ru"),
  ur: () => import("./ur"),
  id: () => import("./id"),
  de: () => import("./de"),
  ja: () => import("./ja"),
  tr: () => import("./tr"),
  ko: () => import("./ko"),
  it: () => import("./it"),
};

export async function getLegal(locale: Locale): Promise<LegalTexts> {
  return (await LOADERS[locale]()).default;
}
