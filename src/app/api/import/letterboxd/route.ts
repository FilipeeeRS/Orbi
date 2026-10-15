import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureMovie } from "@/lib/catalog";
import { releaseYear, searchMovies } from "@/lib/tmdb";
import type { LetterboxdFilm } from "@/lib/letterboxd";

const MAX_BATCH = 40;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const films = Array.isArray(body?.films) ? (body.films as unknown[]).map(sanitize).filter((f) => f !== null) : null;
  if (!films || films.length > MAX_BATCH) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const matched = await mapLimit(films, 6, async (film) => {
    const tmdbId = await findTmdbId(film.name, film.year);
    return { film, item: tmdbId ? await ensureMovie(tmdbId) : null };
  });

  // Dois nomes do Letterboxd podem cair no mesmo filme do TMDB: fica o último.
  const rows = new Map<string, object>();
  for (const { film, item } of matched) {
    if (!item) continue;
    rows.set(item.id, {
      user_id: userId,
      item_id: item.id,
      status: film.status,
      rating: film.status === "watched" ? film.rating : null,
      liked: film.status === "watched" && film.liked,
      review: film.status === "watched" ? film.review : null,
      watched_on: film.status === "watched" ? film.watchedOn : null,
    });
  }

  if (rows.size) {
    const { error } = await supabase.from("entries").upsert([...rows.values()], { onConflict: "user_id,item_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: rows.size,
    notFound: matched.filter((m) => !m.item).map(({ film }) => (film.year ? `${film.name} (${film.year})` : film.name)),
  });
}

async function findTmdbId(name: string, year: number | null) {
  if (year) {
    const exact = await searchMovies(name, { primaryYear: year });
    if (exact[0]) return exact[0].id;
    const anyRelease = await searchMovies(name, { anyYear: year });
    if (anyRelease[0]) return anyRelease[0].id;
  }
  const loose = await searchMovies(name);
  const close = year ? loose.find((m) => Math.abs((releaseYear(m) ?? 0) - year) <= 1) : loose[0];
  return close?.id ?? null;
}

function sanitize(raw: unknown): LetterboxdFilm | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  if (typeof f.name !== "string" || !f.name.trim()) return null;
  const rating = Number(f.rating);
  return {
    name: f.name.trim().slice(0, 300),
    year: Number.isInteger(f.year) ? (f.year as number) : null,
    status: f.status === "watchlist" ? "watchlist" : "watched",
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 10 ? rating : null,
    liked: f.liked === true,
    review: typeof f.review === "string" && f.review.trim() ? f.review.slice(0, 20000) : null,
    watchedOn: typeof f.watchedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.watchedOn) ? f.watchedOn : null,
  };
}

async function mapLimit<T, R>(list: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(list.length);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}
