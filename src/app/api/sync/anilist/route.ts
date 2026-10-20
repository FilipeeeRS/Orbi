import { NextResponse, type NextRequest } from "next/server";
import { syncAniListFull, syncAniListRecent, type AniListType } from "@/lib/anilist-sync";

// Sincronização do catálogo com o AniList. Protegida pelo CRON_SECRET (o agendador manda no cabeçalho).
// GET /api/sync/anilist?type=anime&mode=recent        → o que mudou desde ontem (agendar 1x por dia)
// GET /api/sync/anilist?type=manga&mode=full&pages=20 → próximas 20 páginas da carga completa
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const types: AniListType[] =
    params.get("type") === "manga" ? ["MANGA"] : params.get("type") === "anime" ? ["ANIME"] : ["ANIME", "MANGA"];
  const pages = Math.min(100, Math.max(1, Number(params.get("pages")) || 20));

  const results: Record<string, unknown> = {};
  for (const type of types) {
    results[type] = params.get("mode") === "full" ? await syncAniListFull(type, pages) : await syncAniListRecent(type);
  }
  return NextResponse.json(results);
}
