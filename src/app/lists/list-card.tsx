"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n";
import type { PopularList } from "@/lib/lists";
import { setListLike, setListSave } from "./social-actions";

const HEART = "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z";
const BOOKMARK = "M6 3h12v18l-6-5-6 5z";

// Cartão de uma lista (Home e Todas as listas). A fileira de pôsteres abre a lista; ao passar o mouse,
// uma borda em volta da faixa inteira e, embaixo, ♥ curtir e o marcador salvar (como nos pôsteres).
// Curtida/salva por você: ♥ e o marcador ficam no canto de cima. Embaixo: o nome, quem fez, obras e comentários.
export function ListCard({ list, viewerId }: { list: PopularList; viewerId: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [liked, setLiked] = useState(list.liked);
  const [saved, setSaved] = useState(list.saved);
  const [, start] = useTransition();
  const href = `/u/${list.owner.username}/list/${list.id}`;

  function toggleLike() {
    if (!viewerId) return router.push("/login");
    const next = !liked;
    setLiked(next);
    start(async () => {
      const { ok } = await setListLike(list.id, next);
      if (!ok) setLiked(!next);
    });
  }

  function toggleSave() {
    if (!viewerId) return router.push("/login");
    const next = !saved;
    setSaved(next);
    start(async () => {
      const { ok } = await setListSave(list.id, next);
      if (!ok) setSaved(!next);
    });
  }

  const button = "grid size-7 place-items-center rounded-md transition";

  return (
    <div className="min-w-0">
      <div className="group relative">
        <Link href={href} aria-label={list.title} className="block rounded-md ring-2 ring-transparent transition group-hover:ring-fg">
          <ListStrip posters={list.posters} />
        </Link>
        {/* No canto de cima, como os selos dos pôsteres: ♥ se você curtiu e o marcador branco se salvou */}
        {(liked || saved) && (
          <span className="pointer-events-none absolute end-1.5 top-1.5 z-10 flex items-center gap-1">
            {liked && (
              <span title={t.lists.like} className="grid size-6 place-items-center rounded-md bg-black/75 text-like shadow-md">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
                  <path d={HEART} />
                </svg>
              </span>
            )}
            {saved && (
              <span title={t.lists.savedList} className="grid size-6 place-items-center rounded-md bg-black/75 text-white shadow-md">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" aria-hidden>
                  <path d={BOOKMARK} />
                </svg>
              </span>
            )}
          </span>
        )}
        {/* Ao passar o mouse: ♥ e salvar, sem abrir a lista */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="pointer-events-auto flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-1 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={liked}
              title={t.lists.like}
              className={`${button} ${liked ? "text-like" : "text-white/70 hover:text-white"}`}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d={HEART} />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleSave}
              aria-pressed={saved}
              title={saved ? t.lists.savedList : t.lists.saveList}
              className={`${button} ${saved ? "text-white" : "text-white/70 hover:text-white"}`}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
                <path d={BOOKMARK} />
              </svg>
            </button>
          </div>
        </div>
      </div>
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
