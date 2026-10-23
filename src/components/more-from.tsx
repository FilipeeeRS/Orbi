import { Suspense } from "react";
import { ExternalPosters } from "@/components/external-posters";
import { Section } from "@/components/section";
import { RowSkeleton } from "@/components/skeletons";
import { booksByAuthor } from "@/lib/openlibrary";
import { browseGames } from "@/lib/steam";
import type { Profile } from "@/lib/types";

// Fim da página de um livro ou jogo: outras obras do mesmo autor (Open Library) ou da mesma
// desenvolvedora (Steam), no lugar das "Recomendações" de filmes e séries. Sem nada, a seção some.
export function MoreFrom({
  kind,
  name,
  excludeId,
  title,
  viewer,
}: {
  kind: "book" | "game";
  name: string;
  excludeId: string | number;
  title: string;
  viewer: Profile | null;
}) {
  return (
    <Suspense
      fallback={
        <Section title={title}>
          <RowSkeleton />
        </Section>
      }
    >
      <MoreFromContent kind={kind} name={name} excludeId={excludeId} title={title} viewer={viewer} />
    </Suspense>
  );
}

async function MoreFromContent({ kind, name, excludeId, title, viewer }: Parameters<typeof MoreFrom>[0]) {
  const list =
    kind === "book"
      ? (await booksByAuthor(name, 7))
          .filter((b) => b.id !== excludeId && b.cover)
          .slice(0, 6)
          .map((b) => ({ id: b.id, title: b.title, year: b.year, poster: b.cover, rating: b.rating, by: b.authors.slice(0, 2).join(", ") || null }))
      : (await browseGames({ page: 1, perPage: 7, sort: "popular", developer: name })).list.filter((g) => g.id !== Number(excludeId)).slice(0, 6);
  if (!list.length) return null;
  return (
    <Section title={title}>
      <ExternalPosters kind={kind} list={list} viewer={viewer} layout="row" />
    </Section>
  );
}
