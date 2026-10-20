import Link from "next/link";
import { PosterCaption, PosterImage, PosterGrid } from "@/components/poster";
import { PosterActions } from "@/components/poster-actions";
import { getViewerStates } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { MediaKind, Profile } from "@/lib/types";

// Pôster de uma obra que vem de fora (TMDB ou AniList) e talvez ainda não esteja no catálogo.
export type ExternalPoster = {
  id: number | string; // id na fonte (TMDB, AniList, Steam; livro: "OL45804W" da Open Library)
  itemId?: string; // já no catálogo (lido do banco): dispensa a consulta
  title: string;
  year: number | null;
  poster: string | null; // URL completa
  label?: string; // linha extra embaixo (ex.: "Sequência")
  rating?: number | null; // nota geral 0..5 (da fonte)
};

const SOURCE: Partial<Record<MediaKind, { source: string; type: "movie" | "tv" | "anime" | "manga" | "book" | "game" }>> = {
  movie: { source: "tmdb", type: "movie" },
  series: { source: "tmdb", type: "tv" },
  anime: { source: "anilist", type: "anime" },
  manga: { source: "anilist", type: "manga" },
  book: { source: "openlibrary", type: "book" },
  game: { source: "steam", type: "game" },
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
  kind: "movie" | "series" | "anime" | "manga" | "book" | "game";
  list: ExternalPoster[];
  viewer: Pick<Profile, "id"> | null;
  layout?: "grid" | "row"; // row = uma linha de 6 (3 no celular)
  eager?: number; // quantos pôsteres carregam na hora
}) {
  const { source, type } = SOURCE[kind]!;
  const itemIds = new Map<number | string, string>();
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
    // O id na fonte volta como texto do banco: número em tudo menos livro.
    for (const row of data ?? []) itemIds.set(kind === "book" ? row.external_id : Number(row.external_id), row.id);
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
        <PosterCaption href={href} title={m.title} year={m.year} />
        {m.label && <p className="text-[11px] text-muted">{m.label}</p>}
      </div>
    );
  });

  return layout === "row" ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{cards}</div> : <PosterGrid>{cards}</PosterGrid>;
}
