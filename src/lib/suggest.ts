import "server-only";
import { adultMovieIds } from "./catalog";
import { animeTitle, animeYear, getPopularAnimeIndex, type AnimeCard } from "./anilist";
import { mirrorReady, searchCatalog } from "./anime-db";
import { searchBooks } from "./openlibrary";
import { searchGames } from "./steam";
import { getPopularIndex, isAnime, searchMulti, tmdbImage, type TmdbMultiResult } from "./tmdb";

// Sugestões da busca do topo enquanto a pessoa digita: filmes, séries e pessoas do TMDB.
// O TMDB não tolera erro de digitação ("simsons" não acha "The Simpsons"), então juntamos:
// a busca do TMDB, os títulos populares parecidos com o que foi digitado (índice em cache) e,
// com pouco resultado, buscas por pedaços do texto. Tudo é ordenado pela semelhança + popularidade.

export type Suggestion = {
  type: "movie" | "series" | "anime" | "manga" | "book" | "game" | "person";
  id: number | string;
  title: string;
  year: number | null;
  image: string | null;
  href: string;
};

const LIMIT = 8;
const ARTICLES = new Set(["the", "a", "an", "o", "os", "as", "el", "la", "los", "las", "le", "les", "der", "die", "das"]);

// "Pokémon: O Filme!" → "pokemon o filme"
const clean = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// Distância de edição com troca de letras vizinhas (Damerau-Levenshtein simplificada).
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// 1 = igual; compara com o título inteiro e com o começo dele (a pessoa ainda pode estar digitando).
function similarity(query: string, title: string) {
  if (!query || !title) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 0.95;
  const whole = 1 - distance(query, title) / Math.max(query.length, title.length);
  const start = title.slice(0, query.length + 1);
  const prefix = 1 - distance(query, start) / Math.max(query.length, start.length);
  // Também sem artigo na frente ("the simpsons" ~ "simpsons").
  const bare = title.replace(/^(the|a|an|o|a|os|as|el|la|los|las|le|les|der|die|das) /, "");
  const noArticle = bare === title ? 0 : 1 - distance(query, bare.slice(0, query.length + 1)) / Math.max(query.length, query.length + 1);
  return Math.max(whole, prefix * 0.97, noArticle * 0.97);
}

const titleOf = (r: TmdbMultiResult) => r.title ?? r.name ?? "";

// Semelhança com o título no idioma da pessoa ou com o original ("os simpsons" / "the simpsons").
const bestSimilarity = (q: string, r: TmdbMultiResult) =>
  Math.max(similarity(q, clean(titleOf(r))), similarity(q, clean(r.original_title ?? r.original_name ?? "")));

// Pedaços do texto para quando a busca exata não acha nada: cada palavra sozinha e o começo
// de cada palavra (o erro costuma estar no meio: "breking bad" → "bad", "bre"; "simsons" → "sim").
function variants(query: string) {
  const out = new Set<string>();
  const words = query.split(" ").filter((w) => w.length >= 3 && !ARTICLES.has(w));
  for (const word of words) {
    if (word !== query) out.add(word);
    if (word.length >= 5) out.add(word.slice(0, 3));
    if (word.length >= 6) out.add(word.slice(0, 4));
  }
  if (query.length > 4) out.add(query.slice(0, -1));
  out.delete(query);
  return [...out].slice(0, 6);
}

export async function suggest(query: string, language: string, showAdult: boolean): Promise<Suggestion[]> {
  const q = clean(query).slice(0, 80);
  if (q.length < 2) return [];

  const byKey = new Map<string, TmdbMultiResult>();
  const add = (list: TmdbMultiResult[]) => list.forEach((r) => byKey.set(`${r.media_type}-${r.id}`, r));
  // Animes vêm do AniList (cada temporada separada); se ele demorar (limite de requisições), seguimos sem.
  const withTimeout = <T,>(promise: Promise<T>, fallback: T) =>
    Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 1500))]);
  // Animes e mangás vêm do catálogo (busca por semelhança no banco). Sem a cópia no banco, a busca do
  // AniList não tolera erro, então os animes populares parecidos com o texto completam a lista.
  const [direct, index, animeHits, mangaHits, animeIndex, bookHits, gameHits] = await Promise.all([
    searchMulti(q, language),
    getPopularIndex(language),
    withTimeout(searchCatalog(q, "anime", 6, showAdult), []),
    withTimeout(searchCatalog(q, "manga", 4, showAdult), []),
    mirrorReady("anime").then((ready) => (ready ? [] : withTimeout(getPopularAnimeIndex(), [] as AnimeCard[]))),
    withTimeout(searchBooks(q, 3).then((r) => r.list.map((b) => ({ id: b.id, title: b.title, year: b.year, poster: b.cover }))), []),
    withTimeout(searchGames(q, 3), []),
  ]);
  const animeTitleSim = (a: AnimeCard) =>
    Math.max(...[a.title.english, a.title.romaji].map((t) => similarity(q, clean(t ?? ""))));
  const aniPop = Math.max(1, ...animeIndex.map((a) => a.popularity ?? 0));
  const fromIndex = animeIndex.filter((a) => animeTitleSim(a) >= 0.8);
  add(direct);
  add(index.filter((r) => bestSimilarity(q, r) >= 0.8));
  // Pouco resultado (ou nada parecido): talvez erro de digitação, tenta os pedaços.
  const close = [...byKey.values()].filter((r) => similarity(q, clean(titleOf(r))) > 0.75).length;
  if (close < 3) (await Promise.all(variants(q).map((v) => searchMulti(v, language)))).forEach(add);

  // Tudo vira um candidato no mesmo formato, para ordenar junto (semelhança + popularidade na fonte).
  type Candidate = Suggestion & { sim: number; pop: number };
  const tmdbMax = Math.max(1, ...[...byKey.values()].map((r) => r.popularity ?? 0));
  const candidates: Candidate[] = [
    ...[...byKey.values()]
      // Séries de anime do TMDB ficam de fora: o anime certo vem do AniList.
      .filter((r) => !(r.media_type === "tv" && isAnime(r)))
      .map((r): Candidate => {
        const date = r.release_date || r.first_air_date;
        const title = titleOf(r);
        const base = { sim: bestSimilarity(q, r), pop: Math.log1p(r.popularity ?? 0) / Math.log1p(tmdbMax), id: r.id, title };
        if (r.media_type === "person")
          return {
            ...base,
            type: "person",
            year: null,
            image: tmdbImage(r.profile_path, "w185"),
            href: `/search?${new URLSearchParams({ person: String(r.id), q: title })}`,
          };
        const type = r.media_type === "tv" ? "series" : "movie";
        return {
          ...base,
          type,
          year: date ? Number(date.slice(0, 4)) || null : null,
          image: tmdbImage(r.poster_path, "w185"),
          href: `/${type}/${r.id}`,
        };
      }),
    // Do catálogo vêm já ordenados por semelhança; a posição faz as vezes da popularidade.
    ...(["anime", "manga", "book", "game"] as const).flatMap((kind) =>
      ({ anime: animeHits, manga: mangaHits, book: bookHits, game: gameHits })[kind].map(
        (a, i, all): Candidate => ({
          type: kind,
          id: a.id,
          title: a.title,
          year: a.year,
          image: a.poster,
          href: `/${kind}/${a.id}`,
          sim: Math.max(similarity(q, clean(a.title)), 0.6),
          pop: 1 - i / Math.max(1, all.length),
        }),
      ),
    ),
    ...fromIndex.map(
      (a): Candidate => ({
        type: "anime",
        id: a.id,
        title: animeTitle(a),
        year: animeYear(a),
        image: a.coverImage.large,
        href: `/anime/${a.id}`,
        sim: animeTitleSim(a),
        pop: Math.log1p(a.popularity ?? 0) / Math.log1p(aniPop),
      }),
    ),
  ];

  const ranked = candidates
    .filter((c) => c.sim >= 0.5)
    // Pessoas só passam na frente quando o nome bate de verdade.
    .map((c) => ({ c, score: (c.sim * 0.75 + c.pop * 0.25) * (c.type === "person" && c.sim < 1 ? 0.9 : 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT * 2)
    .map((x) => x.c);

  // O mesmo anime pode vir da busca e do índice: fica uma vez só.
  const seenKeys = new Set<string>();
  let results = ranked.filter((r) => !seenKeys.has(`${r.type}-${r.id}`) && seenKeys.add(`${r.type}-${r.id}`));
  if (!showAdult) {
    const adult = await adultMovieIds(results.filter((r) => r.type === "movie").map((r) => Number(r.id)));
    results = results.filter((r) => r.type !== "movie" || !adult.has(Number(r.id)));
  }
  return results.slice(0, LIMIT).map(({ type, id, title, year, image, href }) => ({ type, id, title, year, image, href }));
}
