import "server-only";
import { cacheLife } from "next/cache";
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
  vote_average?: number;
  vote_count?: number;
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

// ---- Ficha completa do filme (elenco, equipe, detalhes, lançamentos) ----

export const CREW_ROLES = [
  "director",
  "producers",
  "writers",
  "original",
  "casting",
  "editor",
  "cinematography",
  "music",
  "execProducers",
] as const;
export type CrewRole = (typeof CREW_ROLES)[number];

// Função (job) do TMDB → grupo exibido, já na ordem de importância acima.
const JOB_TO_ROLE: Record<string, CrewRole> = {
  Director: "director",
  Producer: "producers",
  Screenplay: "writers",
  Writer: "writers",
  Teleplay: "writers",
  Novel: "original",
  Story: "original",
  Characters: "original",
  Book: "original",
  "Original Story": "original",
  "Comic Book": "original",
  Author: "original",
  Casting: "casting",
  Editor: "editor",
  "Director of Photography": "cinematography",
  "Original Music Composer": "music",
  Music: "music",
  "Executive Producer": "execProducers",
};

export type MovieInfo = {
  runtime: number | null;
  imdbId: string | null;
  genres: string[];
  studios: string[];
  countries: string[]; // ISO 3166-1
  originalLanguage: string | null; // ISO 639-1
  cast: { name: string; character: string }[];
  crew: Partial<Record<CrewRole, string[]>>;
  releases: { country: string; date: string; certification: string }[];
};

type TmdbFullMovie = {
  runtime: number | null;
  imdb_id: string | null;
  original_language: string | null;
  genres: { name: string }[];
  production_companies: { name: string }[];
  production_countries: { iso_3166_1: string }[];
  credits: { cast: { name: string; character: string; order: number }[]; crew: { name: string; job: string }[] };
  release_dates: {
    results: { iso_3166_1: string; release_dates: { release_date: string; type: number; certification: string }[] }[];
  };
};

export async function getMovieInfo(tmdbId: string, language: string): Promise<MovieInfo | null> {
  "use cache";
  cacheLife("days");

  let m: TmdbFullMovie;
  try {
    m = await tmdb<TmdbFullMovie>(`/movie/${tmdbId}`, { language, append_to_response: "credits,release_dates" });
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  const crew: MovieInfo["crew"] = {};
  for (const person of m.credits.crew) {
    const role = JOB_TO_ROLE[person.job];
    if (!role) continue;
    const list = (crew[role] ??= []);
    if (!list.includes(person.name)) list.push(person.name);
  }

  // Um lançamento por país: o primeiro nos cinemas (tipos 2 e 3) ou, na falta, o primeiro de qualquer tipo.
  const releases = m.release_dates.results
    .map(({ iso_3166_1, release_dates }) => {
      const sorted = [...release_dates].sort((a, b) => a.release_date.localeCompare(b.release_date));
      const pick = sorted.find((r) => r.type === 2 || r.type === 3) ?? sorted[0];
      return pick && { country: iso_3166_1, date: pick.release_date.slice(0, 10), certification: pick.certification };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    runtime: m.runtime || null,
    imdbId: m.imdb_id || null,
    genres: m.genres.map((g) => g.name),
    studios: m.production_companies.map((c) => c.name),
    countries: m.production_countries.map((c) => c.iso_3166_1),
    originalLanguage: m.original_language,
    cast: [...m.credits.cast].sort((a, b) => a.order - b.order).map(({ name, character }) => ({ name, character })),
    crew,
    releases,
  };
}
