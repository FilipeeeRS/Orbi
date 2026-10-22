import "server-only";
import { cacheLife } from "next/cache";

// Loja da Steam: fonte dos jogos (por enquanto só os de PC que estão na Steam). Os endpoints públicos
// da loja não precisam de chave; o id do jogo é o "appid" (ex.: 367520 = Hollow Knight).

const STORE = "https://store.steampowered.com/api";
const ASSETS = "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps";

export type GameCard = { id: number; title: string; year: number | null; poster: string | null };

export type Game = GameCard & {
  description: string | null; // resumo curto
  header: string | null; // imagem horizontal (fundo da página)
  developers: string[];
  publishers: string[];
  genres: { id: string; name: string }[];
  platforms: { key: string; name: string }[];
  releaseDate: string | null; // texto da loja ("25 fev. 2017")
  comingSoon: boolean;
  metacritic: number | null; // 0..100
  recommendations: number;
  trailer: string | null; // vídeo mp4
};

type AppDetails = {
  type: string;
  name: string;
  steam_appid: number;
  short_description?: string;
  header_image?: string;
  background_raw?: string;
  developers?: string[];
  publishers?: string[];
  genres?: { id: string; description: string }[];
  platforms?: Record<string, boolean>;
  release_date?: { coming_soon: boolean; date: string };
  metacritic?: { score: number };
  recommendations?: { total: number };
  movies?: { mp4?: { max?: string; "480"?: string } }[];
  content_descriptors?: { ids: number[] };
};

// Capa vertical (600x900, a mesma da biblioteca da Steam); nem todo jogo tem, então confere antes.
export async function gamePoster(id: number): Promise<string | null> {
  "use cache";
  cacheLife("weeks");
  const vertical = `${ASSETS}/${id}/library_600x900.jpg`;
  try {
    const res = await fetch(vertical, { method: "HEAD" });
    if (res.ok) return vertical;
  } catch {}
  // Jogos novos guardam as imagens num endereço com código: usa a capa que a própria loja informa.
  try {
    return (await fetchDetails(id, "english"))?.header_image ?? null;
  } catch {
    return null;
  }
}

const yearOf = (date: string | undefined) => {
  const match = date?.match(/(\d{4})/);
  return match ? Number(match[1]) : null;
};

async function fetchDetails(id: number, lang: string): Promise<AppDetails | null> {
  "use cache";
  cacheLife("days");
  const res = await fetch(`${STORE}/appdetails?appids=${id}&l=${lang}&cc=US`);
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const json = (await res.json()) as Record<string, { success: boolean; data?: AppDetails }>;
  const entry = json[String(id)];
  return entry?.success && entry.data ? entry.data : null;
}

// Idioma da loja: "brazilian", "english", "spanish"... (a Steam usa nomes, não códigos)
const STEAM_LANG: Record<string, string> = {
  pt: "brazilian", en: "english", es: "spanish", fr: "french", de: "german", it: "italian", ru: "russian",
  tr: "turkish", id: "indonesian", zh: "schinese", ja: "japanese", ko: "koreana", ar: "arabic",
};
export const steamLanguage = (locale: string) => STEAM_LANG[locale] ?? "english";

// Ficha de um jogo. null = não existe (ou não é um jogo: DLC, trilha sonora...).
export async function getGame(id: number, locale = "en"): Promise<Game | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  let app: AppDetails | null;
  try {
    app = await fetchDetails(id, steamLanguage(locale));
  } catch {
    return null;
  }
  if (!app || app.type !== "game") return null;
  return {
    id,
    title: app.name,
    year: yearOf(app.release_date?.date),
    poster: await gamePoster(id),
    description: app.short_description ? decodeEntities(app.short_description) : null,
    header: app.background_raw ?? app.header_image ?? null,
    developers: app.developers ?? [],
    publishers: app.publishers ?? [],
    genres: (app.genres ?? []).map((g) => ({ id: g.id, name: g.description })),
    platforms: Object.entries(app.platforms ?? {})
      .filter(([, on]) => on)
      .map(([key]) => ({ key, name: ({ windows: "Windows", mac: "macOS", linux: "Linux" } as Record<string, string>)[key] ?? key })),
    releaseDate: app.release_date?.date || null,
    comingSoon: !!app.release_date?.coming_soon,
    metacritic: app.metacritic?.score ?? null,
    recommendations: app.recommendations?.total ?? 0,
    trailer: app.movies?.[0]?.mp4?.max ?? app.movies?.[0]?.mp4?.["480"] ?? null,
  };
}

const decodeEntities = (text: string) =>
  text.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// Busca na loja (só jogos). Falha vira lista vazia e não vai para o cache.
export async function searchGames(q: string, limit = 20): Promise<GameCard[]> {
  try {
    return (await fetchSearch(q)).slice(0, limit);
  } catch {
    return [];
  }
}

async function fetchSearch(q: string): Promise<GameCard[]> {
  "use cache";
  cacheLife("hours");
  const res = await fetch(`${STORE}/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`);
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const data = (await res.json()) as { items: { type: string; id: number; name: string }[] };
  const apps = data.items.filter((i) => i.type === "app");
  return Promise.all(apps.map(async (i) => ({ id: i.id, title: i.name, year: null, poster: await gamePoster(i.id) })));
}

// Mais jogados agora (ranking oficial da Steam): os "populares da semana" dos jogos.
export async function mostPlayedGames(limit = 12): Promise<GameCard[]> {
  try {
    return await fetchMostPlayed(limit);
  } catch {
    return [];
  }
}

async function fetchMostPlayed(limit: number): Promise<GameCard[]> {
  "use cache";
  cacheLife("hours");
  const res = await fetch("https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/");
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const data = (await res.json()) as { response: { ranks: { appid: number }[] } };
  const ids = data.response.ranks.slice(0, limit).map((r) => r.appid);
  const games = await Promise.all(ids.map((id) => getGame(id)));
  return games.filter((g): g is Game => !!g).map(({ id, title, year, poster }) => ({ id, title, year, poster }));
}

// Avaliações dos usuários da Steam: o rótulo ("Extremamente positivas", no idioma da pessoa) e a nota
// equivalente — cada avaliação positiva vale 10 e cada negativa 0, então a nota é a % de positivas.
export type GameReviews = { label: string; total: number; positive: number; rating: number | null }; // rating 0..10

export async function getGameReviews(id: number, locale = "en"): Promise<GameReviews | null> {
  try {
    return await fetchReviews(id, steamLanguage(locale));
  } catch {
    return null;
  }
}

async function fetchReviews(id: number, lang: string): Promise<GameReviews | null> {
  "use cache";
  cacheLife("hours");
  const res = await fetch(
    `https://store.steampowered.com/appreviews/${id}?json=1&language=all&purchase_type=all&num_per_page=0&l=${lang}`,
  );
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const data = (await res.json()) as {
    query_summary?: { review_score_desc: string; total_positive: number; total_negative: number; total_reviews: number };
  };
  const q = data.query_summary;
  if (!q || !q.total_reviews) return null;
  const total = q.total_positive + q.total_negative;
  return {
    label: q.review_score_desc,
    total: q.total_reviews,
    positive: q.total_positive,
    rating: total ? Math.round((q.total_positive / total) * 100) / 10 : null,
  };
}

// ---- Catálogo inteiro (busca da loja): o "Ver tudo" dos jogos, com paginação e ordenação ----

// Ordenações das listagens → filtros/ordem da busca da loja.
const STORE_SORT: Record<string, string> = {
  week: "filter=topsellers", // mais vendidos agora
  month: "filter=popularnew", // lançamentos populares
  year: "filter=globaltopsellers",
  popular: "", // relevância da própria loja: os jogos mais populares de sempre (CS2, Warframe...)
  top: "sort_by=Reviews_DESC",
  "top-asc": "sort_by=Reviews_ASC",
  release: "sort_by=Released_DESC",
  "release-old": "sort_by=Released_ASC",
  title: "sort_by=Name_ASC",
  "title-desc": "sort_by=Name_DESC",
  upcoming: "filter=popularcomingsoon", // ainda não lançados, dos mais aguardados
};

// Gênero da loja (id do appdetails) → tag da busca da loja.
const GENRE_TAG: Record<string, number> = {
  "1": 19, "25": 21, "4": 597, "23": 492, "3": 122, "28": 599, "2": 9, "18": 701, "9": 699, "29": 128, "37": 113, "70": 493,
};
export const genreTag = (genreId: string) => GENRE_TAG[genreId] ?? null;

// Gêneros do filtro de "Todos os jogos" (tags da loja; nomes como a Steam mostra).
export const GAME_GENRES: { tag: number; name: string }[] = [
  { tag: 19, name: "Action" },
  { tag: 21, name: "Adventure" },
  { tag: 597, name: "Casual" },
  { tag: 1664, name: "Puzzle" },
  { tag: 1625, name: "Platformer" },
  { tag: 1774, name: "Shooter" },
  { tag: 1667, name: "Horror" },
  { tag: 122, name: "RPG" },
  { tag: 1695, name: "Open World" },
  { tag: 599, name: "Simulation" },
  { tag: 9, name: "Strategy" },
  { tag: 701, name: "Sports" },
  { tag: 699, name: "Racing" },
  { tag: 128, name: "Massively Multiplayer" },
  { tag: 492, name: "Indie" },
  { tag: 113, name: "Free to Play" },
  { tag: 493, name: "Early Access" },
];

export type GameFilters = { developer?: string; publisher?: string; tag?: number; os?: string };

export async function browseGames(opts: { page: number; perPage: number; sort: string; q?: string } & GameFilters) {
  const filters = [
    opts.developer && `developer=${encodeURIComponent(opts.developer)}`,
    opts.publisher && `publisher=${encodeURIComponent(opts.publisher)}`,
    opts.tag && `tags=${opts.tag}`,
    opts.os && ["win", "mac", "linux"].includes(opts.os) && `os=${opts.os}`,
  ]
    .filter(Boolean)
    .join("&");
  const order = [STORE_SORT[opts.sort] ?? "", filters].filter(Boolean).join("&");
  try {
    return await fetchStorePage(opts.page, opts.perPage, order, opts.q?.trim() ?? "");
  } catch {
    return { list: [] as GameCard[], total: 0 };
  }
}

async function fetchStorePage(page: number, perPage: number, order: string, q: string) {
  "use cache";
  cacheLife("hours");
  // category1=998 = só jogos (sem DLC, trilha sonora, software)
  const url = `https://store.steampowered.com/search/results/?infinite=1&category1=998&cc=US&l=english&start=${
    (page - 1) * perPage
  }&count=${perPage}&${order}${q ? `&term=${encodeURIComponent(q)}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const data = (await res.json()) as { total_count: number; results_html: string };
  // Cada resultado é um <a data-ds-appid="..."> com o título e a data de lançamento.
  const rows = data.results_html.split("<a ").slice(1);
  const list = await Promise.all(
    rows
      .map((html) => ({
        id: Number(html.match(/data-ds-appid="(\d+)"/)?.[1]),
        title: decodeEntities(html.match(/<span class="title">([^<]*)/)?.[1] ?? ""),
        year: yearOf(html.match(/search_released[^>]*>\s*([^<]*)/)?.[1]),
      }))
      .filter((g) => g.id && g.title)
      .map(async (g) => ({ ...g, poster: await gamePoster(g.id) })),
  );
  // A loja ignora o "count" pedido e às vezes devolve mais: corta no tamanho da página.
  return { list: list.slice(0, perPage), total: data.total_count };
}
