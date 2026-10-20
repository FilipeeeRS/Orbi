import Link from "next/link";
import { PosterGrid } from "@/components/poster";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ListSummary } from "@/lib/lists";
import { ListEditor } from "./list-editor";

// Aba Listas: a caixa "+ Nova lista" (só para o dono) e as listas, cada uma do tamanho de um pôster
// com os primeiros pôsteres empilhados, o nome e a quantidade de filmes.
export function ListsGrid({ lists, isOwner, username, t }: { lists: ListSummary[]; isOwner: boolean; username: string; t: Dictionary }) {
  if (!lists.length && !isOwner) return <p className="text-sm text-muted">{t.lists.empty}</p>;
  return (
    <PosterGrid>
      {isOwner && <ListEditor username={username} variant="card" />}
      {lists.map((list) => (
        <Link key={list.id} href={`/u/${username}/list/${list.id}`} className="group block">
          <ListCover posters={list.posters} />
          <p className="mt-1.5 line-clamp-2 text-sm font-semibold group-hover:text-accent">{list.title}</p>
          <p className="text-xs text-muted">{t.lists.count(list.count)}</p>
        </Link>
      ))}
    </PosterGrid>
  );
}

// Até 3 pôsteres em leque: o primeiro na frente, os outros um pouco atrás e para a direita.
export function ListCover({ posters }: { posters: (string | null)[] }) {
  const shown = posters.slice(0, 3);
  return (
    <div className="relative aspect-[2/3]">
      {shown.length === 0 && <div className="absolute inset-0 rounded-md border border-border bg-surface-2" />}
      {shown
        .map((url, i) => (
          <div
            key={i}
            className="absolute inset-y-0 start-0 w-[80%] overflow-hidden rounded-md border border-border bg-surface-2 shadow-[4px_0_12px_rgba(0,0,0,0.5)] transition group-hover:border-fg"
            style={{ transform: `translateX(${i * 12.5}%)`, zIndex: 3 - i, top: `${i * 3}%`, bottom: `${i * 3}%` }}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element -- capa da lista (CDN do TMDB/Storage)
              <img src={url} alt="" loading="lazy" className="size-full object-cover" />
            )}
          </div>
        ))
        .reverse()}
    </div>
  );
}
