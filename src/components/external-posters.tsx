import Link from "next/link";
import { PosterImage, PosterGrid } from "@/components/poster";
import { PosterActions } from "@/components/poster-actions";
import { getViewerStates } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { MediaKind, Profile } from "@/lib/types";

// Pôster de uma obra que vem de fora (TMDB ou AniList) e talvez ainda não esteja no catálogo.
export type ExternalPoster = {
  id: number; // id na fonte (TMDB ou AniList)
  itemId?: string; // já no catálogo (lido do banco): dispensa a consulta
  title: string;
  year: number | null;
  poster: string | null; // URL completa
  label?: string; // linha extra embaixo (ex.: "Sequência")
};

const SOURCE: Partial<Record<MediaKind, { source: string; type: "movie" | "tv" | "anime" | "manga" }>> = {
  movie: { source: "tmdb", type: "movie" },
  series: { source: "tmdb", type: "tv" },
  anime: { source: "anilist", type: "anime" },
  manga: { source: "anilist", type: "manga" },
};

// Grade (ou uma linha só) de pôsteres de fora, com os atalhos ✓ ▶ ♥ 🕐 para quem está logado:
// o que já está no catálogo traz o estado do usuário; o resto é criado no primeiro clique.
export async function ExternalPosters({
  kind,
  list,
  viewer,
  layout = "grid",
  eager = 0,
}: {
  kind: "movie" | "series" | "anime" | "manga";
  list: ExternalPoster[];
  viewer: Pick<Profile, "id"> | null;
  layout?: "grid" | "row"; // row = uma linha de 6 (3 no celular)
  eager?: number; // quantos pôsteres carregam na hora
}) {
  const { source, type } = SOURCE[kind]!;
  const itemIds = new Map<number, string>();
  let states: Awaited<ReturnType<typeof getViewerStates>> = new Map();
  for (const m of list) if (m.itemId) itemIds.set(m.id, m.itemId);
  const missing = list.filter((m) => !m.itemId);
  if (viewer && missing.length) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("items")
      .select("id, external_id")
      .eq("kind", kind)
      .eq("source", source)
      .in("external_id", missing.map((m) => String(m.id)));
    for (const row of data ?? []) itemIds.set(Number(row.external_id), row.id);
  }
  if (viewer && itemIds.size) states = await getViewerStates(viewer.id, [...itemIds.values()]);

  const cards = list.map((m, i) => {
    const href = `/${kind}/${m.id}`;
    const itemId = itemIds.get(m.id) ?? null;
    return (
      <div key={m.id} className={`group ${layout === "row" && i >= 3 ? "max-sm:hidden" : ""}`}>
        <div className="relative">
          <Link href={href} className="block" title={m.year ? `${m.title} (${m.year})` : m.title}>
            <PosterImage url={m.poster} title={m.title} eager={i < eager} hoverRing={!viewer} />
          </Link>
          {viewer && (
            <PosterActions
              itemId={itemId}
              tmdb={{ type, id: m.id }}
              viewerId={viewer.id}
              initial={itemId ? (states.get(itemId) ?? null) : null}
              series={kind !== "movie"}
            />
          )}
        </div>
        <Link href={href} className="mt-1 line-clamp-2 block text-xs">
          {m.title} {m.year && <span className="text-muted">{m.year}</span>}
        </Link>
        {m.label && <p className="text-[11px] text-muted">{m.label}</p>}
      </div>
    );
  });

  return layout === "row" ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{cards}</div> : <PosterGrid>{cards}</PosterGrid>;
}
