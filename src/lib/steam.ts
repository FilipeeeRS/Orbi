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
  genres: string[];
  platforms: string[];
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
  genres?: { description: string }[];
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
    return res.ok ? vertical : `${ASSETS}/${id}/header.jpg`;
  } catch {
    return `${ASSETS}/${id}/header.jpg`;
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
    genres: (app.genres ?? []).map((g) => g.description),
    platforms: Object.entries(app.platforms ?? {})
      .filter(([, on]) => on)
      .map(([name]) => ({ windows: "Windows", mac: "macOS", linux: "Linux" })[name] ?? name),
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
