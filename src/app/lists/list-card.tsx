import Link from "next/link";
import { Avatar } from "@/components/avatar";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PopularList } from "@/lib/lists";

// Cartão de uma lista (Home e Todas as listas): fileira de pôsteres (só ela abre a lista; ao passar o
// mouse, uma borda só em volta da faixa inteira, como a watchlist do perfil), o nome,
// quem fez, quantas obras, comentários e curtidas.
export function ListCard({ list, t }: { list: PopularList; t: Dictionary }) {
  return (
    <div className="min-w-0">
      <Link href={`/u/${list.owner.username}/list/${list.id}`} className="block rounded-md ring-2 ring-transparent transition hover:ring-fg">
        <ListStrip posters={list.posters} />
      </Link>
      <p className="mt-2 truncate font-semibold">{list.title}</p>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted">
        <Link href={`/u/${list.owner.username}`} className="flex min-w-0 items-center gap-1.5 font-semibold hover:text-fg">
          <Avatar profile={list.owner} size={18} />
          <span className="truncate">{list.owner.display_name || list.owner.username}</span>
        </Link>
        <span className="shrink-0">{t.lists.count(list.count)}</span>
        <span className="flex shrink-0 items-center gap-1">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
          </svg>
          {list.comments}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
          </svg>
          {list.likes}
        </span>
      </div>
    </div>
  );
}

// Capa da lista: até 5 pôsteres em fileira, um por cima do outro, o primeiro na frente.
function ListStrip({ posters }: { posters: (string | null)[] }) {
  const shown = posters.slice(0, 5);
  return (
    <div className="relative aspect-[20/9] overflow-hidden rounded-md">
      {shown.map((url, i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-[30%] overflow-hidden rounded-md border border-border bg-surface-2 shadow-[4px_0_12px_rgba(0,0,0,0.6)]"
          style={{ insetInlineStart: `${i * 17.5}%`, zIndex: 5 - i }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element -- pôster da lista (CDN)
            <img src={url} alt="" loading="lazy" className="size-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
