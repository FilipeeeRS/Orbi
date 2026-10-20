import "server-only";
import { createAdminClient } from "./supabase/admin";
import { fuzzyToIso, plainDescription } from "./anilist";

// Cópia do AniList no banco do Orbi (animes e mangás). Duas formas:
// - completa: percorre tudo por id, página por página (a primeira carga, feita uma vez);
// - recente: só o que mudou desde a última sincronização (roda todo dia).
// O AniList aceita ~30 requisições por minuto, então há uma pausa entre as páginas.

export type AniListType = "ANIME" | "MANGA";

const PER_PAGE = 50;
const PAUSE_MS = 2200;
// Mangá tem dezenas de milhares de títulos obscuros: só entram os que têm um mínimo de leitores.
const MIN_MANGA_POPULARITY = 100;

export type Media = {
  id: number;
  idMal: number | null;
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  duration: number | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  isAdult: boolean;
  updatedAt: number | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  description: string | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  coverImage: { extraLarge: string | null; large: string | null };
  bannerImage: string | null;
};

const FIELDS = `id idMal format status season seasonYear episodes chapters volumes duration averageScore popularity
  genres isAdult updatedAt title { romaji english native } description(asHtml: false)
  startDate { year month day } coverImage { extraLarge large } bannerImage`;

async function fetchPage(type: AniListType, page: number, sort: "ID" | "UPDATED_AT_DESC") {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `query ($page: Int, $type: MediaType, $sort: [MediaSort]) {
          Page(page: $page, perPage: ${PER_PAGE}) { pageInfo { hasNextPage } media(type: $type, sort: $sort) { ${FIELDS} } }
        }`,
        variables: { page, type, sort: [sort] },
      }),
    });
    if (res.status === 429 && attempt < 5) {
      await sleep((Number(res.headers.get("retry-after")) || 30) * 1000);
      continue;
    }
    const json = (await res.json()) as { data?: { Page: { pageInfo: { hasNextPage: boolean }; media: Media[] } } };
    if (!res.ok || !json.data) throw new Error(`AniList ${res.status} na página ${page}`);
    return json.data.Page;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Uma linha da tabela items a partir de um anime/mangá do AniList.
export function toRow(m: Media, type: AniListType) {
  const title = m.title.english || m.title.romaji || m.title.native || `#${m.id}`;
  return {
    kind: type === "ANIME" ? "anime" : "manga",
    source: "anilist",
    external_id: String(m.id),
    title,
    original_title: m.title.romaji && m.title.romaji !== title ? m.title.romaji : m.title.native,
    year: m.seasonYear ?? m.startDate.year,
    overview: plainDescription(m.description),
    poster_url: m.coverImage.extraLarge ?? m.coverImage.large,
    backdrop_url: m.bannerImage,
    translations: m.title.native ? { ja: { title: m.title.native } } : {},
    tmdb_rating: m.averageScore != null ? m.averageScore / 10 : null, // nota da fonte, 0..10
    tmdb_votes: m.popularity ?? 0, // popularidade da fonte
    is_adult_rated: m.isAdult,
    genre_ids: [],
    genres: m.genres,
    runtime: m.duration,
    release_date: fuzzyToIso(m.startDate),
    episode_count: m.episodes,
    chapters: m.chapters,
    volumes: m.volumes,
    mal_id: m.idMal,
    format: m.format,
    status: m.status,
    season: m.season,
    season_year: m.seasonYear,
    source_updated_at: m.updatedAt ? new Date(m.updatedAt * 1000).toISOString() : null,
  };
}

const keep = (m: Media, type: AniListType) =>
  !m.isAdult && m.format !== "MUSIC" && (type === "ANIME" || (m.popularity ?? 0) >= MIN_MANGA_POPULARITY);

async function save(rows: ReturnType<typeof toRow>[]) {
  if (!rows.length) return;
  const { error } = await createAdminClient().from("items").upsert(rows, { onConflict: "kind,source,external_id" });
  if (error) throw error;
}

// Carga completa: importa até `pages` páginas a partir da última salva e guarda onde parou.
// Chamada várias vezes até terminar (cada chamada cabe no tempo de uma requisição).
export async function syncAniListFull(type: AniListType, pages: number) {
  const admin = createAdminClient();
  const key = `anilist:${type}`;
  const { data: state } = await admin.from("sync_state").select("cursor").eq("key", key).maybeSingle();
  let page = (state?.cursor ?? 0) + 1;
  let saved = 0;
  let done = false;
  for (let i = 0; i < pages; i++, page++) {
    const result = await fetchPage(type, page, "ID");
    const rows = result.media.filter((m) => keep(m, type)).map((m) => toRow(m, type));
    await save(rows);
    saved += rows.length;
    await admin.from("sync_state").upsert({ key, cursor: page });
    if (!result.pageInfo.hasNextPage) {
      done = true;
      await admin.from("sync_state").upsert({ key, cursor: page, synced_at: new Date().toISOString() });
      break;
    }
    await sleep(PAUSE_MS);
  }
  return { saved, lastPage: page, done };
}

// Diária: o que mudou no AniList desde a última sincronização (lançamentos, episódios novos, notas).
export async function syncAniListRecent(type: AniListType, maxPages = 40) {
  const admin = createAdminClient();
  const key = `anilist:${type}:recent`;
  const { data: state } = await admin.from("sync_state").select("synced_at").eq("key", key).maybeSingle();
  const since = state?.synced_at ? new Date(state.synced_at).getTime() / 1000 : Date.now() / 1000 - 2 * 86400;
  const startedAt = new Date().toISOString();
  let saved = 0;
  for (let page = 1; page <= maxPages; page++) {
    const result = await fetchPage(type, page, "UPDATED_AT_DESC");
    const fresh = result.media.filter((m) => (m.updatedAt ?? 0) >= since);
    const rows = fresh.filter((m) => keep(m, type)).map((m) => toRow(m, type));
    await save(rows);
    saved += rows.length;
    if (fresh.length < result.media.length || !result.pageInfo.hasNextPage) break;
    await sleep(PAUSE_MS);
  }
  await admin.from("sync_state").upsert({ key, cursor: 0, synced_at: startedAt });
  return { saved };
}
