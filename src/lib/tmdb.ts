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
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  popularity?: number;
  origin_country?: string[];
  original_language?: string;
};

// Anime = animação japonesa (gênero 16 do TMDB + Japão). Fica fora da pasta de séries.
export const isAnime = (m: Pick<TmdbMovie, "genre_ids" | "origin_country" | "original_language">) =>
  (m.genre_ids ?? []).includes(16) && (m.origin_country?.includes("JP") || m.original_language === "ja");

// Filmes e séries usam os mesmos endpoints do TMDB, trocando "movie" por "tv".
export type TmdbType = "movie" | "tv";

// Série do TMDB nos mesmos campos de filme (name → title, first_air_date → release_date),
// para busca, "Ver tudo" e filtros funcionarem igual para os dois.
type TmdbShowResult = Omit<TmdbMovie, "title" | "original_title" | "release_date"> & {
  name: string;
  original_name: string;
  first_air_date?: string;
};
const asMovie = (show: TmdbShowResult): TmdbMovie => ({
  ...show,
  title: show.name,
  original_title: show.original_name,
  release_date: show.first_air_date,
});
const normalize = (type: TmdbType, list: (TmdbMovie | TmdbShowResult)[]): TmdbMovie[] =>
  type === "tv" ? (list as TmdbShowResult[]).map(asMovie) : (list as TmdbMovie[]);

export const tmdbLanguage = (locale: Locale) => TMDB_LANGUAGES[locale];

export function tmdbImage(path: string | null | undefined, size: "w185" | "w342" | "w500" | "w780" | "w1280") {
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

// Busca por título em várias páginas de uma vez (para os filtros da busca terem material).
export async function searchMoviesPages(query: string, language: string, pages = 3, type: TmdbType = "movie") {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      (type === "tv" ? searchShows(query, language, i + 1) : searchMovies(query, { language, page: i + 1 })).catch(() => []),
    ),
  );
  const seen = new Set<number>();
  return results.flat().filter((m) => !seen.has(m.id) && seen.add(m.id));
}

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

async function searchShows(query: string, language: string, page: number) {
  const data = await tmdb<{ results: TmdbShowResult[] }>("/search/tv", { query, language, page, include_adult: "false" });
  return normalize("tv", data.results);
}

export type TmdbTranslation = {
  iso_639_1: string;
  iso_3166_1: string;
  data: { title?: string; overview?: string };
};

// Detalhes em inglês + todas as traduções em uma chamada só.
export function getMovieWithTranslations(id: number | string) {
  return tmdb<TmdbMovie & { translations: { translations: TmdbTranslation[] }; release_dates: ReleaseDates }>(`/movie/${id}`, {
    language: "en-US",
    append_to_response: "translations,release_dates",
  });
}

export const releaseYear = (m: Pick<TmdbMovie, "release_date">) =>
  m.release_date ? Number(m.release_date.slice(0, 4)) || null : null;

// ---- Ficha completa do filme (elenco, equipe, detalhes, lançamentos) ----

export const CREW_ROLES = [
  "creator", // só séries
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

export type Named = { id: number; name: string };

export type MovieInfo = {
  runtime: number | null;
  imdbId: string | null;
  genres: Named[];
  studios: Named[];
  countries: string[]; // ISO 3166-1
  originalLanguage: string | null; // ISO 639-1
  cast: (Named & { character: string })[];
  crew: Partial<Record<CrewRole, Named[]>>;
  releases: { country: string; date: string; certification: string }[];
  // Classificação indicativa por país (ex.: { BR: "14", US: "PG-13" }); prefere a do cinema.
  certifications: Record<string, string>;
  trailer: string | null; // id do vídeo no YouTube
  // Onde assistir, por país (dados do JustWatch via TMDB)
  watch: Record<string, WatchOptions>;
};

export type WatchProvider = { id: number; name: string; logo: string | null };
export const WATCH_KINDS = ["flatrate", "free", "ads", "rent", "buy"] as const;
export type WatchKind = (typeof WATCH_KINDS)[number];
export type WatchOptions = { link: string } & Partial<Record<WatchKind, WatchProvider[]>>;

type TmdbProvider = { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number };

type TmdbFullMovie = {
  runtime: number | null;
  imdb_id: string | null;
  original_language: string | null;
  genres: Named[];
  production_companies: Named[];
  production_countries: { iso_3166_1: string }[];
  credits: {
    cast: { id: number; name: string; character: string; order: number }[];
    crew: { id: number; name: string; job: string }[];
  };
  release_dates: {
    results: { iso_3166_1: string; release_dates: { release_date: string; type: number; certification: string }[] }[];
  };
  videos?: { results: { key: string; site: string; type: string; official: boolean; iso_639_1: string }[] };
  "watch/providers"?: { results: Record<string, { link: string } & Partial<Record<WatchKind, TmdbProvider[]>>> };
};

export async function getMovieInfo(tmdbId: string, language: string): Promise<MovieInfo | null> {
  "use cache";
  cacheLife("days");

  let m: TmdbFullMovie;
  try {
    m = await tmdb<TmdbFullMovie>(`/movie/${tmdbId}`, {
      language,
      append_to_response: "credits,release_dates,videos,watch/providers",
      // Vídeos no idioma da pessoa e, na falta, em inglês ou sem idioma.
      include_video_language: `${language.slice(0, 2)},en,null`,
    });
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  const crew: MovieInfo["crew"] = {};
  for (const person of m.credits.crew) {
    const role = JOB_TO_ROLE[person.job];
    if (!role) continue;
    const list = (crew[role] ??= []);
    if (!list.some((p) => p.id === person.id)) list.push({ id: person.id, name: person.name });
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

  const certifications: Record<string, string> = {};
  for (const { iso_3166_1, release_dates } of m.release_dates.results) {
    const rated = release_dates.filter((r) => r.certification.trim());
    const pick = rated.find((r) => r.type === 3) ?? rated.find((r) => r.type === 2) ?? rated[0];
    if (pick) certifications[iso_3166_1] = pick.certification.trim();
  }

  const { trailer, watch } = videosAndWatch(m, language);

  return {
    runtime: m.runtime || null,
    certifications,
    trailer,
    watch,
    imdbId: m.imdb_id || null,
    genres: m.genres.map(({ id, name }) => ({ id, name })),
    studios: m.production_companies.map(({ id, name }) => ({ id, name })),
    countries: m.production_countries.map((c) => c.iso_3166_1),
    originalLanguage: m.original_language,
    cast: [...m.credits.cast]
      .sort((a, b) => a.order - b.order)
      .map(({ id, name, character }) => ({ id, name, character })),
    crew,
    releases,
  };
}

// Trailer e "onde assistir" (mesmo formato em filmes e séries).
function videosAndWatch(m: Pick<TmdbFullMovie, "videos" | "watch/providers">, language: string) {
  // Trailer do YouTube: no idioma da pessoa primeiro, oficial antes de não oficial.
  const lang = language.slice(0, 2);
  const trailers = (m.videos?.results ?? []).filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const score = (v: (typeof trailers)[number]) => (v.iso_639_1 === lang ? 2 : 0) + (v.official ? 1 : 0);
  const trailer = [...trailers].sort((a, b) => score(b) - score(a))[0]?.key ?? null;

  const watch: Record<string, WatchOptions> = {};
  for (const [country, r] of Object.entries(m["watch/providers"]?.results ?? {})) {
    const options: WatchOptions = { link: r.link };
    for (const kind of WATCH_KINDS) {
      const list = r[kind];
      if (list?.length) {
        options[kind] = [...list]
          .sort((a, b) => a.display_priority - b.display_priority)
          .map((p) => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path }));
      }
    }
    watch[country] = options;
  }
  return { trailer, watch };
}

// ---- Séries: catálogo, ficha, temporadas e episódios ----

type TmdbTvTranslation = { iso_639_1: string; iso_3166_1: string; data: { name?: string; overview?: string } };
// Traduções de série/temporada usam "name"; o catálogo espera "title", como nos filmes.
const asMovieTranslations = (list: TmdbTvTranslation[]): TmdbTranslation[] =>
  list.map((t) => ({ ...t, data: { title: t.data.name, overview: t.data.overview } }));

export type TmdbShow = TmdbMovie & {
  adult?: boolean;
  episode_run_time?: number[];
  translations: { translations: TmdbTranslation[] };
};

// Detalhes da série em inglês + traduções, já no formato de filme.
export async function getShowWithTranslations(id: number | string): Promise<TmdbShow> {
  const show = await tmdb<
    TmdbShowResult & { adult?: boolean; episode_run_time?: number[]; genres?: Named[]; translations: { translations: TmdbTvTranslation[] } }
  >(`/tv/${id}`, { language: "en-US", append_to_response: "translations" });
  return { ...asMovie(show), adult: show.adult, episode_run_time: show.episode_run_time, translations: { translations: asMovieTranslations(show.translations.translations) } };
}

export type TmdbEpisode = {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
  vote_count?: number;
};

export type TmdbSeason = {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  poster_path: string | null;
  season_number: number;
  episodes?: TmdbEpisode[];
};

export async function getSeasonWithTranslations(showId: number | string, season: number) {
  const data = await tmdb<TmdbSeason & { translations: { translations: TmdbTvTranslation[] } }>(
    `/tv/${showId}/season/${season}`,
    { language: "en-US", append_to_response: "translations" },
  );
  return { ...data, translations: asMovieTranslations(data.translations.translations) };
}

// Episódios de uma temporada no idioma da pessoa.
export async function getSeasonEpisodes(showId: string, season: number, language: string) {
  "use cache";
  cacheLife("days");
  try {
    const data = await tmdb<TmdbSeason>(`/tv/${showId}/season/${season}`, { language });
    return { name: data.name, overview: data.overview, airDate: data.air_date, episodes: data.episodes ?? [] };
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }
}

export type SeasonSummary = {
  number: number;
  name: string;
  episodes: number;
  airDate: string | null;
  poster: string | null; // caminho do TMDB
};

export type SeriesInfo = MovieInfo & {
  networks: Named[];
  seasons: SeasonSummary[];
  // Próximo episódio com data marcada (null em série encerrada ou sem data)
  nextAir: { season: number; episode: number; date: string } | null;
  // Sem episódio marcado: a próxima temporada já anunciada com data de estreia
  nextSeason: { season: number; date: string } | null;
};

type TmdbFullShow = Pick<TmdbFullMovie, "videos" | "watch/providers"> & {
  episode_run_time: number[];
  original_language: string | null;
  genres: Named[];
  production_companies: Named[];
  networks: Named[];
  origin_country: string[];
  created_by: Named[];
  seasons: { season_number: number; name: string; episode_count: number; air_date: string | null; poster_path: string | null }[];
  aggregate_credits: {
    cast: { id: number; name: string; order: number; roles: { character: string }[] }[];
    crew: { id: number; name: string; jobs: { job: string }[] }[];
  };
  content_ratings: { results: { iso_3166_1: string; rating: string }[] };
  external_ids: { imdb_id: string | null };
  status: string | null;
  next_episode_to_air: { air_date: string | null; season_number: number; episode_number: number } | null;
};

export async function getSeriesInfo(tmdbId: string, language: string): Promise<SeriesInfo | null> {
  "use cache";
  cacheLife("days");

  let m: TmdbFullShow;
  try {
    m = await tmdb<TmdbFullShow>(`/tv/${tmdbId}`, {
      language,
      append_to_response: "aggregate_credits,content_ratings,videos,watch/providers,external_ids",
      include_video_language: `${language.slice(0, 2)},en,null`,
    });
  } catch (e) {
    if (e instanceof TmdbNotFound) return null;
    throw e;
  }

  const crew: MovieInfo["crew"] = {};
  if (m.created_by.length) crew.creator = m.created_by.map(({ id, name }) => ({ id, name }));
  for (const person of m.aggregate_credits.crew) {
    for (const { job } of person.jobs) {
      const role = JOB_TO_ROLE[job];
      if (!role) continue;
      const list = (crew[role] ??= []);
      if (!list.some((p) => p.id === person.id)) list.push({ id: person.id, name: person.name });
    }
  }

  const certifications: Record<string, string> = {};
  for (const r of m.content_ratings.results) if (r.rating.trim()) certifications[r.iso_3166_1] = r.rating.trim();

  const { trailer, watch } = videosAndWatch(m, language);

  return {
    runtime: m.episode_run_time[0] || null,
    certifications,
    trailer,
    watch,
    imdbId: m.external_ids.imdb_id || null,
    genres: m.genres.map(({ id, name }) => ({ id, name })),
    studios: m.production_companies.map(({ id, name }) => ({ id, name })),
    networks: m.networks.map(({ id, name }) => ({ id, name })),
    countries: m.origin_country,
    originalLanguage: m.original_language,
    cast: [...m.aggregate_credits.cast]
      .sort((a, b) => a.order - b.order)
      .map(({ id, name, roles }) => ({ id, name, character: roles[0]?.character ?? "" })),
    crew,
    releases: [],
    nextAir:
      m.next_episode_to_air?.air_date && m.status !== "Ended" && m.status !== "Canceled"
        ? {
            season: m.next_episode_to_air.season_number,
            episode: m.next_episode_to_air.episode_number,
            date: m.next_episode_to_air.air_date,
          }
        : null,
    nextSeason: (() => {
      if (m.next_episode_to_air?.air_date) return null;
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = m.seasons.find((s) => s.season_number > 0 && s.air_date && s.air_date > today);
      return upcoming ? { season: upcoming.season_number, date: upcoming.air_date! } : null;
    })(),
    // Especiais (temporada 0) vão para o fim da lista.
    seasons: m.seasons
      .map((s) => ({ number: s.season_number, name: s.name, episodes: s.episode_count, airDate: s.air_date, poster: s.poster_path }))
      .sort((a, b) => (a.number || 1e6) - (b.number || 1e6)),
  };
}

// Todas as temporadas com os episódios (no idioma da pessoa), para as abas da série:
// tabela de notas (média do TMDB) e lista de episódios. Até 20 temporadas por chamada (limite do append_to_response).
export type SeasonEpisodes = {
  season: number;
  name: string;
  episodes: (TmdbEpisode & { rating: number | null })[];
};

export async function getSeriesEpisodes(tmdbId: string, seasons: number[], language: string): Promise<SeasonEpisodes[]> {
  "use cache";
  cacheLife("days");
  const chunks: number[][] = [];
  for (let i = 0; i < seasons.length; i += 20) chunks.push(seasons.slice(i, i + 20));
  try {
    const pages = await Promise.all(
      chunks.map((chunk) =>
        tmdb<Record<string, TmdbSeason | undefined>>(`/tv/${tmdbId}`, {
          language,
          append_to_response: chunk.map((n) => `season/${n}`).join(","),
        }),
      ),
    );
    return seasons.map((season, i) => {
      const data = pages[Math.floor(i / 20)][`season/${season}`];
      return {
        season,
        name: data?.name ?? "",
        episodes: (data?.episodes ?? []).map((e) => ({
          ...e,
          // Sem votos (ou ainda não lançado) não tem nota.
          rating: e.vote_count ? Math.round(e.vote_average * 10) / 10 : null,
        })),
      };
    });
  } catch {
    return [];
  }
}

// "Recomendações" no fim da página: o que o TMDB recomenda para quem gostou da obra;
// com pouca coisa, completa com as parecidas (mesmos gêneros e palavras-chave).
export async function getRecommendations(type: TmdbType, tmdbId: string, language: string): Promise<TmdbMovie[]> {
  "use cache";
  cacheLife("days");
  const fetchList = (kind: "recommendations" | "similar") =>
    tmdb<{ results: (TmdbMovie | TmdbShowResult)[] }>(`/${type}/${tmdbId}/${kind}`, { language })
      .then((r) => normalize(type, r.results))
      .catch(() => [] as TmdbMovie[]);
  const recommended = await fetchList("recommendations");
  const list = recommended.length >= 12 ? recommended : [...recommended, ...(await fetchList("similar"))];
  const seen = new Set<number>();
  return list.filter((m) => m.poster_path && !seen.has(m.id) && seen.add(m.id));
}

// ---- Sugestões da busca (enquanto a pessoa digita) ----

export type TmdbMultiResult = {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string; // filmes
  name?: string; // séries e pessoas
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  popularity?: number;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
  known_for_department?: string;
};

// Filmes, séries e pessoas de uma vez (primeira página), no idioma da pessoa.
export async function searchMulti(query: string, language: string): Promise<TmdbMultiResult[]> {
  "use cache";
  cacheLife("hours");
  try {
    const data = await tmdb<{ results: TmdbMultiResult[] }>("/search/multi", { query, language, include_adult: "false" });
    return data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv" || r.media_type === "person");
  } catch {
    return [];
  }
}

// Índice dos filmes e séries mais populares e mais bem avaliados (~2 mil títulos), para a busca
// achar o título mesmo com erro de digitação. Montado uma vez por semana em cada idioma.
export async function getPopularIndex(language: string): Promise<TmdbMultiResult[]> {
  "use cache";
  cacheLife("weeks");
  const lists: [string, "movie" | "tv", number][] = [
    ["/movie/popular", "movie", 25],
    ["/movie/top_rated", "movie", 15],
    ["/tv/popular", "tv", 15],
    ["/tv/top_rated", "tv", 15],
  ];
  const requests = lists.flatMap(([path, type, pages]) =>
    Array.from({ length: pages }, (_, i) => () =>
      tmdb<{ results: TmdbMultiResult[] }>(path, { language, page: i + 1 })
        .then((r) => r.results.map((m) => ({ ...m, media_type: type })))
        .catch(() => [] as TmdbMultiResult[]),
    ),
  );
  const out: TmdbMultiResult[] = [];
  // Em lotes, para não estourar o limite de requisições do TMDB.
  for (let i = 0; i < requests.length; i += 10) out.push(...(await Promise.all(requests.slice(i, i + 10).map((r) => r()))).flat());
  const seen = new Set<string>();
  return out.filter((m) => !seen.has(`${m.media_type}-${m.id}`) && seen.add(`${m.media_type}-${m.id}`));
}

// ---- Classificação indicativa 18 anos ----

type ReleaseDates = { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };

// "Proibido para menores de 18" só nos mercados de referência; olhar todos os países
// marcava como +18 filmes comuns que algum país isolado classifica mais alto.
const ADULT_CERTS: Record<string, string[]> = {
  US: ["NC-17", "X"],
  BR: ["18"],
  GB: ["18", "R18"],
  DE: ["18"],
  FR: ["18"],
};

export function hasAdultRating(releaseDates: ReleaseDates | undefined) {
  return !!releaseDates?.results.some((r) => {
    const certs = ADULT_CERTS[r.iso_3166_1];
    return certs && r.release_dates.some((d) => certs.includes(d.certification.trim().toUpperCase()));
  });
}

// Só respostas de verdade vão para o cache: se o TMDB falhar, o erro sobe e nada é guardado
// (antes uma falha virava "não é +18" por semanas e o filme aparecia na busca).
async function fetchAdultRating(tmdbId: number): Promise<boolean> {
  "use cache";
  cacheLife("weeks");
  return hasAdultRating(await tmdb<ReleaseDates>(`/movie/${tmdbId}/release_dates`));
}

// null = não deu para saber agora (o TMDB falhou).
export async function isAdultRatedMovie(tmdbId: number): Promise<boolean | null> {
  try {
    return await fetchAdultRating(tmdbId);
  } catch {
    return null;
  }
}

// Lista de gêneros de filme do TMDB no idioma pedido (para o filtro das pastas).
export async function getMovieGenres(language: string, type: TmdbType = "movie"): Promise<{ id: number; name: string }[]> {
  "use cache";
  cacheLife("weeks");
  try {
    const data = await tmdb<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`, { language });
    return data.genres;
  } catch {
    return [];
  }
}

// ---- Navegar pela ficha: filmes de uma pessoa, de um gênero, estúdio ou país ----

type PersonCredits = { cast: (TmdbMovie | TmdbShowResult)[]; crew: (TmdbMovie | TmdbShowResult)[] };

// Todos os filmes (ou séries) em que a pessoa atuou ou trabalhou, dos mais populares para os menos.
export async function getPersonMovies(personId: number, language: string, type: TmdbType = "movie"): Promise<TmdbMovie[]> {
  "use cache";
  cacheLife("days");
  try {
    const credits = await tmdb<PersonCredits>(`/person/${personId}/${type}_credits`, { language });
    const byId = new Map<number, TmdbMovie>();
    for (const m of normalize(type, [...credits.crew, ...credits.cast])) if (!byId.has(m.id)) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 60);
  } catch {
    return [];
  }
}

export async function discoverMovies(
  filter: { genre?: number; company?: number; network?: number; country?: string },
  language: string,
  type: TmdbType = "movie",
): Promise<TmdbMovie[]> {
  "use cache";
  cacheLife("days");
  try {
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        tmdb<{ results: (TmdbMovie | TmdbShowResult)[] }>(`/discover/${type}`, {
          language,
          page,
          sort_by: "popularity.desc",
          include_adult: "false",
          with_genres: filter.genre,
          with_companies: filter.company,
          with_networks: filter.network,
          with_origin_country: filter.country,
        }),
      ),
    );
    return pages.flatMap((p) => normalize(type, p.results));
  } catch {
    return [];
  }
}

// ---- "Ver tudo": acervo inteiro do TMDB ----

type TmdbPage = { results: TmdbMovie[]; total_results: number; total_pages: number };

export async function tmdbTrendingWeek(page: number, language: string, type: TmdbType = "movie"): Promise<TmdbPage> {
  "use cache";
  cacheLife("hours");
  try {
    const data = await tmdb<TmdbPage>(`/trending/${type}/week`, { page, language });
    return { ...data, results: normalize(type, data.results) };
  } catch {
    return { results: [], total_results: 0, total_pages: 0 };
  }
}

export async function tmdbDiscover(
  params: Record<string, string | number | undefined>,
  page: number,
  language: string,
  type: TmdbType = "movie",
): Promise<TmdbPage> {
  "use cache";
  cacheLife("hours");
  try {
    const data = await tmdb<TmdbPage>(`/discover/${type}`, { ...params, page, language, include_adult: "false" });
    return { ...data, results: normalize(type, data.results) };
  } catch {
    return { results: [], total_results: 0, total_pages: 0 };
  }
}

// ---- Imagens alternativas (pôster e fundo escolhidos pelo usuário) ----

type TmdbImage = { file_path: string; iso_639_1: string | null; vote_average: number; vote_count: number };

// Pôsteres e fundos do filme (ou série), os do idioma da pessoa primeiro, depois os mais votados. Só caminhos ("/abc.jpg").
export async function getMovieImages(
  tmdbId: number,
  language: string,
  type: TmdbType = "movie",
): Promise<{ posters: string[]; backdrops: string[] }> {
  "use cache";
  cacheLife("days");
  const lang = language.slice(0, 2);
  const data = await tmdb<{ posters: TmdbImage[]; backdrops: TmdbImage[] }>(`/${type}/${tmdbId}/images`, {
    include_image_language: `${lang},en,null`,
  });
  const rank = (list: TmdbImage[], preferLang: string | null) =>
    [...list]
      .sort(
        (a, b) =>
          Number(b.iso_639_1 === preferLang) - Number(a.iso_639_1 === preferLang) ||
          b.vote_count - a.vote_count ||
          b.vote_average - a.vote_average,
      )
      .map((i) => i.file_path)
      .slice(0, 60);
  // Fundos sem texto (idioma nulo) costumam ser os melhores para ficar atrás da página.
  return { posters: rank(data.posters, lang), backdrops: rank(data.backdrops, null) };
}
