import { unzipSync, strFromU8 } from "fflate";
import Papa from "papaparse";

// Um filme do export já consolidado (watched + ratings + likes + reviews + diary + watchlist).
export type LetterboxdFilm = {
  name: string;
  year: number | null;
  status: "watched" | "watchlist";
  rating: number | null; // 1..10
  liked: boolean;
  review: string | null;
  watchedOn: string | null; // YYYY-MM-DD
};

type Row = Record<string, string>;

function readCsv(files: Record<string, Uint8Array>, name: string): Row[] {
  // Ignora as pastas deleted/ e orphaned/ que o Letterboxd também inclui.
  const path = Object.keys(files).find((p) => {
    const lower = p.toLowerCase();
    return (lower === name || lower.endsWith("/" + name)) && !/(^|\/)(deleted|orphaned)\//.test(lower);
  });
  if (!path) return [];
  const { data } = Papa.parse<Row>(strFromU8(files[path]), { header: true, skipEmptyLines: true });
  return data;
}

const keyOf = (row: Row) => `${row.Name}\u0000${row.Year ?? ""}`;
const toRating = (value?: string) => {
  const n = Number(value);
  return value && n > 0 ? Math.min(10, Math.max(1, Math.round(n * 2))) : null;
};
const toDate = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null);

export function parseLetterboxdExport(zip: Uint8Array): LetterboxdFilm[] {
  const files = unzipSync(zip, { filter: (f) => f.name.toLowerCase().endsWith(".csv") });

  const watched = readCsv(files, "watched.csv");
  const watchlist = readCsv(files, "watchlist.csv");
  if (!watched.length && !watchlist.length && !readCsv(files, "ratings.csv").length) {
    throw new Error("invalid-export");
  }

  const films = new Map<string, LetterboxdFilm>();
  const get = (row: Row) => {
    const key = keyOf(row);
    let film = films.get(key);
    if (!film) {
      film = {
        name: row.Name,
        year: Number(row.Year) || null,
        status: "watched",
        rating: null,
        liked: false,
        review: null,
        watchedOn: null,
      };
      films.set(key, film);
    }
    return film;
  };

  for (const row of watched) {
    const film = get(row);
    film.watchedOn ??= toDate(row.Date);
  }
  for (const row of readCsv(files, "ratings.csv")) get(row).rating = toRating(row.Rating);
  for (const row of readCsv(files, "likes/films.csv")) get(row).liked = true;

  // Diário e reviews: fica a data de visualização mais recente e a review mais recente.
  const latest = new Map<string, string>();
  for (const row of [...readCsv(files, "diary.csv"), ...readCsv(files, "reviews.csv")]) {
    const film = get(row);
    const date = toDate(row["Watched Date"]) ?? toDate(row.Date);
    if (date && (!film.watchedOn || date > film.watchedOn)) film.watchedOn = date;
    if (row.Review?.trim()) {
      const key = keyOf(row);
      const when = toDate(row.Date) ?? "";
      if (!latest.has(key) || when >= latest.get(key)!) {
        film.review = row.Review.trim();
        latest.set(key, when);
      }
    }
  }

  // Watchlist só vale para o que ainda não foi visto.
  for (const row of watchlist) {
    if (!films.has(keyOf(row))) get(row).status = "watchlist";
  }

  return [...films.values()].filter((f) => f.name);
}
