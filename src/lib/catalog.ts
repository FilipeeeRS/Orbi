import "server-only";
import { cache } from "react";
import { createAdminClient } from "./supabase/admin";
import { getMovieWithTranslations, releaseYear, tmdbImage, TmdbNotFound, type TmdbTranslation } from "./tmdb";
import { LOCALES, TMDB_LANGUAGES } from "./i18n/dictionaries";
import type { Item } from "./types";

// Garante que o filme do TMDB exista no catálogo (tabela items) e o devolve.
export async function ensureMovie(tmdbId: number): Promise<Item | null> {
  const admin = createAdminClient();
  const externalId = String(tmdbId);

  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("kind", "movie")
    .eq("source", "tmdb")
    .eq("external_id", externalId)
    .maybeSingle();
  // Filmes salvos antes do suporte a vários idiomas só têm "pt": busca as traduções de novo.
  const legacy = existing && Object.keys(existing.translations ?? {}).every((k) => k === "pt");
  if (existing && !legacy) return existing as Item;

  let movie;
  try {
    movie = await getMovieWithTranslations(tmdbId);
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  const { data, error } = await admin
    .from("items")
    .upsert(
      {
        kind: "movie",
        source: "tmdb",
        external_id: externalId,
        title: movie.title,
        original_title: movie.original_title,
        year: releaseYear(movie),
        overview: movie.overview || null,
        poster_url: tmdbImage(movie.poster_path, "w500"),
        backdrop_url: tmdbImage(movie.backdrop_path, "w1280"),
        translations: pickTranslations(movie.translations.translations, movie.title),
      },
      { onConflict: "kind,source,external_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as Item;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /movie/603 = filme do TMDB; /movie/<uuid> = filme cadastrado manualmente.
export const getMovieByRouteId = cache(async (id: string): Promise<Item | null> => {
  if (UUID.test(id)) {
    const { data } = await createAdminClient().from("items").select("*").eq("id", id).eq("kind", "movie").maybeSingle();
    return data as Item | null;
  }
  const tmdbId = Number(id);
  return Number.isInteger(tmdbId) && tmdbId > 0 ? ensureMovie(tmdbId) : null;
});

// Uma tradução por idioma do Orbi, preferindo a região padrão (pt-BR, zh-CN...).
function pickTranslations(list: TmdbTranslation[], englishTitle: string): Item["translations"] {
  const out: Item["translations"] = {};
  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const region = TMDB_LANGUAGES[locale].split("-")[1];
    const candidates = list.filter((t) => t.iso_639_1 === locale);
    const best = candidates.find((t) => t.iso_3166_1 === region) ?? candidates[0];
    const title = best?.data.title?.trim();
    const overview = best?.data.overview?.trim();
    if (!title && !overview) continue;
    out[locale] = {
      ...(title && title !== englishTitle ? { title } : {}),
      ...(overview ? { overview } : {}),
    };
  }
  return out;
}
