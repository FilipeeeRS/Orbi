import "server-only";
import { cache } from "react";
import { createAdminClient } from "./supabase/admin";
import { getMovie, releaseYear, tmdbImage, TmdbNotFound } from "./tmdb";
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
  if (existing) return existing as Item;

  let en, pt;
  try {
    [en, pt] = await Promise.all([getMovie(tmdbId, "en-US"), getMovie(tmdbId, "pt-BR")]);
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
        title: en.title,
        title_pt: pt.title !== en.title ? pt.title : null,
        original_title: en.original_title,
        year: releaseYear(en),
        overview: en.overview || null,
        overview_pt: pt.overview || null,
        poster_url: tmdbImage(pt.poster_path ?? en.poster_path, "w500"),
        backdrop_url: tmdbImage(en.backdrop_path, "w1280"),
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
