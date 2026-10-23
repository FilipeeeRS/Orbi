import "server-only";
import { cacheLife } from "next/cache";

// Open Library (openlibrary.org): fonte dos livros. Grátis, sem chave. Cada livro é uma "obra" (work),
// com id como "OL45804W"; capas pelo id da capa.

const API = "https://openlibrary.org";
const HEADERS = { "User-Agent": "Orbi/1.0 (https://github.com/FilipeeeRS/Orbi)" };

export type BookCard = {
  id: string; // "OL45804W"
  title: string;
  authors: string[];
  year: number | null;
  cover: string | null;
  rating: number | null; // 0..5
  ratings: number;
};

export type Book = BookCard & {
  alreadyRead: number; // "já li" na Open Library
  wantToRead: number; // "quero ler"
  description: string | null;
  subjects: string[];
  pages: number | null;
  publishers: string[];
  firstSentence: string | null;
};

export const coverUrl = (id: number | null | undefined, size: "M" | "L" = "L") =>
  id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : null;

// "/works/OL45804W" → "OL45804W"
const workId = (key: string) => key.replace("/works/", "");

type SearchDoc = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  ratings_average?: number;
  ratings_count?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  subject?: string[];
  first_sentence?: string[];
  already_read_count?: number;
  want_to_read_count?: number;
};

const FIELDS = "key,title,author_name,first_publish_year,cover_i,ratings_average,ratings_count";

const toCard = (d: SearchDoc): BookCard => ({
  id: workId(d.key),
  title: d.title,
  authors: d.author_name ?? [],
  year: d.first_publish_year ?? null,
  cover: coverUrl(d.cover_i),
  rating: d.ratings_average ?? null,
  ratings: d.ratings_count ?? 0,
});

async function get<T>(path: string): Promise<T> {
  const res = await fetch(API + path, { headers: HEADERS });
  if (res.status === 404) throw new BookNotFound();
  if (!res.ok) throw new Error(`Open Library ${res.status} em ${path}`);
  return res.json() as Promise<T>;
}

export class BookNotFound extends Error {}

// Descrição da Open Library vem em Markdown, às vezes com notas depois de "----": vira texto simples.
function plainText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n-{3,}\n/)[0]
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [texto](link) → texto
    .replace(/\*\*?([^*]+)\*\*?/g, "$1") // **negrito** / *itálico*
    .replace(/^#+\s*/gm, "")
    .trim();
}

// Ficha de um livro: dados da busca (autores, ano, nota, páginas) + a obra (descrição e assuntos).
export async function getBook(id: string): Promise<Book | null> {
  "use cache";
  cacheLife("days");
  if (!/^OL\d+W$/.test(id)) return null;
  try {
    const [search, work] = await Promise.all([
      get<{ docs: SearchDoc[] }>(
        `/search.json?q=key:/works/${id}&fields=${FIELDS},number_of_pages_median,publisher,subject,first_sentence,already_read_count,want_to_read_count&limit=1`,
      ),
      get<{ title: string; description?: string | { value: string }; subjects?: string[]; covers?: number[] }>(
        `/works/${id}.json`,
      ),
    ]);
    const doc = search.docs[0];
    const description = typeof work.description === "string" ? work.description : (work.description?.value ?? null);
    return {
      ...(doc ? toCard(doc) : { id, title: work.title, authors: [], year: null, cover: null, rating: null, ratings: 0 }),
      cover: doc?.cover_i ? coverUrl(doc.cover_i) : coverUrl(work.covers?.[0]),
      description: description ? plainText(description) : null,
      alreadyRead: doc?.already_read_count ?? 0,
      wantToRead: doc?.want_to_read_count ?? 0,
      subjects: (work.subjects ?? doc?.subject ?? []).filter((s) => s.length < 40).slice(0, 12),
      pages: doc?.number_of_pages_median ?? null,
      publishers: (doc?.publisher ?? []).slice(0, 4),
      firstSentence: doc?.first_sentence?.[0] ?? null,
    };
  } catch (e) {
    if (e instanceof BookNotFound) return null;
    throw e;
  }
}

// Busca por título/autor. Falha vira lista vazia (e não vai para o cache).
export async function searchBooks(q: string, limit = 20, page = 1): Promise<{ list: BookCard[]; total: number }> {
  try {
    return await fetchSearch(q, limit, page);
  } catch {
    return { list: [], total: 0 };
  }
}

// Livros de um autor, dos mais lidos para os menos. Só os com algumas avaliações: assim traduções e
// cadastros repetidos da mesma obra (que quase nunca têm nota) ficam de fora.
export async function booksByAuthor(name: string, limit = 6): Promise<BookCard[]> {
  const author = name.replace(/"/g, "").trim();
  if (!author) return [];
  try {
    return (await fetchSearch(`author:"${author}" AND ratings_count:[5 TO *]&sort=readinglog`, limit, 1, true)).list;
  } catch {
    return [];
  }
}

// raw = a consulta já vem montada (com filtros e &sort=...).
async function fetchSearch(q: string, limit: number, page: number, raw = false) {
  "use cache";
  cacheLife("hours");
  const data = await get<{ docs: SearchDoc[]; numFound: number }>(
    `/search.json?q=${raw ? q.replace(/ /g, "%20") : encodeURIComponent(q)}&fields=${FIELDS}&limit=${limit}&page=${page}`,
  );
  return { list: data.docs.map(toCard), total: data.numFound };
}

export type BookSort = "week" | "month" | "year" | "popular" | "top" | "top-asc" | "release" | "release-old" | "title" | "title-desc";

// "Ver tudo" dos livros: o acervo (com um mínimo de avaliações, para não vir lixo) numa ordem; com texto, a busca.
// "Populares esta semana" usa o ranking da semana da Open Library.
export async function browseBooks(opts: {
  page: number;
  perPage: number;
  sort: BookSort;
  q?: string;
  decade?: number;
  subject?: string; // gênero/assunto ("Fantasy")
}) {
  // Popularidade: os rankings da própria Open Library (semana, mês, ano e de sempre).
  const period = { week: "weekly", month: "monthly", year: "yearly", popular: "forever" }[opts.sort as string] as
    | "weekly"
    | "monthly"
    | "yearly"
    | "forever"
    | undefined;
  if (period && !opts.q && !opts.decade && !opts.subject) {
    const list = await trendingBooks(period, opts.perPage, opts.page);
    if (list.length) return { list, total: list.length < opts.perPage ? (opts.page - 1) * opts.perPage + list.length : 1000 };
    // Ranking da Open Library fora do ar: cai para os mais registrados (lidos/quero ler) da busca.
  }
  const sort = { week: "readinglog", month: "readinglog", year: "readinglog", popular: "readinglog", top: "rating", "top-asc": "rating asc", release: "new", "release-old": "old", title: "title", "title-desc": "title" }[opts.sort];
  const filters = [
    opts.q?.trim() ? opts.q.trim() : "ratings_count:[20 TO *]",
    opts.decade ? `first_publish_year:[${opts.decade} TO ${opts.decade + 9}]` : "",
    opts.subject ? `subject:"${opts.subject.replace(/"/g, "")}"` : "",
  ].filter(Boolean);
  const query = `${filters.join(" AND ")}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`;
  try {
    return await fetchSearch(query, opts.perPage, opts.page, true);
  } catch {
    return { list: [], total: 0 };
  }
}

// Em alta (Open Library): "weekly" para os populares da semana, "yearly"/"forever" para o acervo.
export async function trendingBooks(period: "weekly" | "monthly" | "yearly" | "forever", limit = 40, page = 1): Promise<BookCard[]> {
  try {
    return await fetchTrending(period, limit, page);
  } catch {
    return [];
  }
}

async function fetchTrending(period: string, limit: number, page: number) {
  "use cache";
  cacheLife("hours");
  const data = await get<{ works: SearchDoc[] }>(`/trending/${period}.json?limit=${limit}&page=${page}`);
  return data.works.map(toCard);
}
