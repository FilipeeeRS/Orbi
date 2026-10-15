import "server-only";
import { TMDB_LANGUAGES, type Locale } from "./i18n/dictionaries";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
};

export const tmdbLanguage = (locale: Locale) => TMDB_LANGUAGES[locale];

export function tmdbImage(path: string | null | undefined, size: "w342" | "w500" | "w1280") {
  return path ? `${IMG}/${size}${path}` : null;
}

async function tmdb<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY não configurada");

  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));

  // Aceita tanto o Read Access Token (v4, JWT) quanto a API key v3.
  const isBearer = key.startsWith("eyJ");
  if (!isBearer) url.searchParams.set("api_key", key);

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: isBearer ? { Authorization: `Bearer ${key}` } : {} });
    if (res.status === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    if (res.status === 404) throw new TmdbNotFound();
    if (!res.ok) throw new Error(`TMDB ${res.status} em ${path}`);
    return res.json() as Promise<T>;
  }
}

export class TmdbNotFound extends Error {}

export async function searchMovies(
  query: string,
  opts: { primaryYear?: number; anyYear?: number; language?: string; page?: number } = {},
) {
  const data = await tmdb<{ results: TmdbMovie[]; total_pages: number }>("/search/movie", {
    query,
    primary_release_year: opts.primaryYear,
    year: opts.anyYear,
    language: opts.language ?? "en-US",
    page: opts.page,
    include_adult: "false",
  });
  return data.results;
}

export type TmdbTranslation = {
  iso_639_1: string;
  iso_3166_1: string;
  data: { title?: string; overview?: string };
};

// Detalhes em inglês + todas as traduções em uma chamada só.
export function getMovieWithTranslations(id: number | string) {
  return tmdb<TmdbMovie & { translations: { translations: TmdbTranslation[] } }>(`/movie/${id}`, {
    language: "en-US",
    append_to_response: "translations",
  });
}

export const releaseYear = (m: Pick<TmdbMovie, "release_date">) =>
  m.release_date ? Number(m.release_date.slice(0, 4)) || null : null;
