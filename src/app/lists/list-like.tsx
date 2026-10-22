"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n";
import { setListLike } from "./social-actions";

// ♥ com a contagem no cartão da lista: curte sem abrir a lista. Sem login, leva para entrar.
export function ListCardLike({
  listId,
  viewerId,
  initialLiked,
  initialCount,
}: {
  listId: string;
  viewerId: string | null;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { t } = useI18n();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, start] = useTransition();
  const className = `flex shrink-0 items-center gap-1 transition ${liked ? "text-like" : "hover:text-like"}`;
  const heart = (
    <svg viewBox="0 0 24 24" className="size-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  );

  if (!viewerId)
    return (
      <Link href="/login" title={t.lists.like} className={className}>
        {heart}
        {count}
      </Link>
    );

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((n) => n + (next ? 1 : -1));
    start(async () => {
      const { ok } = await setListLike(listId, next);
      if (!ok) {
        setLiked(!next);
        setCount((n) => n + (next ? -1 : 1));
      }
    });
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={liked} title={t.lists.like} className={className}>
      {heart}
      {count}
    </button>
  );
}
