"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "./i18n";

export type ViewerItemState = { watched: boolean; liked: boolean; hasDetails: boolean };

const today = () => new Date().toLocaleDateString("sv-SE");

// Atalhos que aparecem sobre o pôster ao passar o mouse: ✓ visto e ♥ curtir (do usuário logado).
export function PosterActions({
  itemId,
  viewerId,
  initial,
}: {
  itemId: string;
  viewerId: string;
  initial: ViewerItemState | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<ViewerItemState>(initial ?? { watched: false, liked: false, hasDetails: false });
  const [pending, start] = useTransition();

  function save(next: ViewerItemState) {
    const previous = state;
    setState(next);
    start(async () => {
      const supabase = createClient();
      // Upsert parcial: só mexe nas colunas enviadas, então nota e review continuam como estão.
      const { error } = next.watched
        ? await supabase.from("entries").upsert(
            {
              user_id: viewerId,
              item_id: itemId,
              status: "watched",
              liked: next.liked,
              ...(previous.watched ? {} : { watched_on: today() }),
            },
            { onConflict: "user_id,item_id" },
          )
        : await supabase.from("entries").delete().eq("user_id", viewerId).eq("item_id", itemId);
      if (error) setState(previous);
      router.refresh();
    });
  }

  function toggleWatched() {
    if (state.watched && state.hasDetails && !confirm(t.movie.confirmRemove)) return;
    save(state.watched ? { watched: false, liked: false, hasDetails: false } : { ...state, watched: true });
  }

  // Curtir também marca como visto, como no Letterboxd.
  const toggleLike = () => save({ ...state, watched: true, liked: !state.liked });

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={toggleWatched}
          disabled={pending}
          aria-pressed={state.watched}
          title={state.watched ? t.movie.watched : t.movie.watch}
          className={`grid size-7 place-items-center rounded-full transition hover:bg-white/10 ${
            state.watched ? "text-ok" : "text-white/70 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending}
          aria-pressed={state.liked}
          title={state.liked ? t.movie.liked : t.movie.like}
          className={`grid size-7 place-items-center rounded-full transition hover:bg-white/10 ${
            state.liked ? "text-like" : "text-white/70 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill={state.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
