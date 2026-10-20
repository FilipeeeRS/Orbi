"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Coração para curtir uma review. Cada pessoa curte uma vez (pode ser a própria review).
export function ReviewLike({
  entryId,
  viewerId,
  initialLiked,
  initialCount,
  label,
}: {
  entryId: string;
  viewerId: string | null;
  initialLiked: boolean;
  initialCount: number;
  label: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  const heart = (
    <svg viewBox="0 0 24 24" className="size-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  );
  const className = `flex shrink-0 items-center gap-1 py-1 text-xs tabular-nums transition ${
    liked ? "text-like" : "text-muted hover:text-like"
  }`;

  // Sem login, o coração leva para entrar.
  if (!viewerId) {
    return (
      <Link href="/login" className={className} title={label}>
        {heart}
        {count > 0 && count}
      </Link>
    );
  }

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const supabase = createClient();
      const { error } = next
        ? await supabase.from("review_likes").insert({ entry_id: entryId, user_id: viewerId })
        : await supabase.from("review_likes").delete().eq("entry_id", entryId).eq("user_id", viewerId);
      if (error) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={liked} title={label} className={className}>
      {heart}
      {count > 0 && count}
    </button>
  );
}
