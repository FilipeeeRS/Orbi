import { NextResponse, type NextRequest } from "next/server";
import { getLocale, getViewer } from "@/lib/session";
import { suggest } from "@/lib/suggest";
import { tmdbLanguage } from "@/lib/tmdb";

// GET /api/suggest?q=simsons → sugestões para a caixa de busca (filmes, séries e pessoas).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const [viewer, locale] = await Promise.all([getViewer(), getLocale()]);
  const results = await suggest(q, tmdbLanguage(locale), !!viewer?.show_adult);
  return NextResponse.json(results);
}
