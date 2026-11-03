import Link from "next/link";
import { PosterCaption, PosterImage, PosterGrid } from "@/components/poster";
import { PosterActions } from "@/components/poster-actions";
import { getViewerStates } from "@/lib/queries";
import { getDict } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { MediaKind, Profile } from "@/lib/types";

// Pôster de uma obra que vem de fora (TMDB ou AniList) e talvez ainda não esteja no catálogo.
export type ExternalPoster = {
  by?: string | null; // livros: autor(es), mostrado como "by Fulano" na legenda
  id: number | string; // id na fonte (TMDB, AniList, Steam; livro: "OL45804W" da Open Library)
  itemId?: string; // já no catálogo (lido do banco): dispensa a consulta
  title: string;
  year: number | null;
  poster: string | null; // URL completa
  label?: string; // linha extra embaixo (ex.: "Sequência")
  rating?: number | null; // nota geral 0..5 (da fonte)
  unreleased?: boolean; // ainda não lançado: no hover, só a watchlist
  kind?: PosterKind; // numa linha misturada (ex.: Mais aguardados), a pasta desta obra
};

type PosterKind = "movie" | "series" | "anime" | "manga" | "book" | "game";

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
  kind: PosterKind; // pasta padrão (cada obra pode trazer a sua em m.kind)
  list: ExternalPoster[];
  viewer: Pick<Profile, "id"> | null;
  layout?: "grid" | "row"; // row = uma linha de 6 (3 no celular)
  eager?: number; // quantos pôsteres carregam na hora
}) {
  const { t } = await getDict();
  const kindOf = (m: ExternalPoster) => m.kind ?? kind;
  // Chave pasta:id, porque numa linha misturada o mesmo id pode existir em fontes diferentes
  const key = (k: PosterKind, id: number | string) => `${k}:${id}`;
  const itemIds = new Map<string, string>();
  let states: Awaited<ReturnType<typeof getViewerStates>> = new Map();
  for (const m of list) if (m.itemId) itemIds.set(key(kindOf(m), m.id), m.itemId);
  const missing = list.filter((m) => !m.itemId);
  if (viewer && missing.length) {
    const supabase = await createClient();
    await Promise.all(
      [...new Set(missing.map(kindOf))].map(async (k) => {
        const { data } = await supabase
          .from("items")
          .select("id, external_id")
          .eq("kind", k)
          .eq("source", SOURCE[k]!.source)
          .in("external_id", missing.filter((m) => kindOf(m) === k).map((m) => String(m.id)));
        for (const row of data ?? []) itemIds.set(key(k, row.external_id), row.id);
      }),
    );
  }
  if (viewer && itemIds.size) states = await getViewerStates(viewer.id, [...itemIds.values()]);

  const cards = list.map((m, i) => {
    const k = kindOf(m);
    const href = `/${k}/${m.id}`;
    const itemId = itemIds.get(key(k, m.id)) ?? null;
    return (
      <div key={key(k, m.id)} className={`group ${layout === "row" && i >= 3 ? "max-sm:hidden" : ""}`}>
        <div className="relative">
          <Link href={href} className="block" title={m.year ? `${m.title} (${m.year})` : m.title}>
            <PosterImage url={m.poster} title={m.title} eager={i < eager} hoverRing={!viewer} />
          </Link>
          {viewer && (
            <PosterActions
              itemId={itemId}
              tmdb={{ type: SOURCE[k]!.type, id: m.id }}
              viewerId={viewer.id}
              initial={itemId ? (states.get(itemId) ?? null) : null}
              series={k !== "movie"}
              unreleased={m.unreleased}
              verb={k === "book" || k === "manga" ? "read" : k === "game" ? "play" : "watch"}
            />
          )}
        </div>
        <PosterCaption href={href} title={m.title} year={m.year} by={m.by ? t.book.by(m.by) : null} />
        {m.label && <p className="text-[11px] text-muted">{m.label}</p>}
      </div>
    );
  });

  return layout === "row" ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{cards}</div> : <PosterGrid>{cards}</PosterGrid>;
}
