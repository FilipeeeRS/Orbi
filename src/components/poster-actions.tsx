"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "./i18n";

export type ViewerItemState = {
  watched: boolean;
  liked: boolean;
  watchlist: boolean;
  hasDetails: boolean;
};

const EMPTY: ViewerItemState = {
  watched: false,
  liked: false,
  watchlist: false,
  hasDetails: false,
};
const today = () => new Date().toLocaleDateString("sv-SE");

// Atalhos sobre o pôster (✓ visto, ♥ curtir, 🕐 watchlist) e a borda de hover, que fica verde
// quando o usuário logado já viu o filme. Tudo usa o estado atual, então muda na hora do clique.
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
  const [state, setState] = useState<ViewerItemState>(initial ?? EMPTY);
  // Desmarcar um filme com nota/review pede um segundo clique (em vez de um confirm do navegador).
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  function save(next: ViewerItemState) {
    const previous = state;
    setState(next);
    start(async () => {
      const supabase = createClient();
      let result;
      if (next.watched) {
        // Upsert parcial: só mexe nas colunas enviadas, então nota e review continuam como estão.
        result = await supabase.from("entries").upsert(
          {
            user_id: viewerId,
            item_id: itemId,
            status: "watched",
            liked: next.liked,
            ...(previous.watched ? {} : { watched_on: today() }),
          },
          { onConflict: "user_id,item_id" },
        );
      } else if (next.watchlist) {
        result = await supabase
          .from("entries")
          .upsert(
            {
              user_id: viewerId,
              item_id: itemId,
              status: "watchlist",
              liked: false,
              rating: null,
              review: null,
              watched_on: null,
            },
            { onConflict: "user_id,item_id" },
          );
      } else {
        result = await supabase
          .from("entries")
          .delete()
          .eq("user_id", viewerId)
          .eq("item_id", itemId);
      }
      if (result.error) {
        console.error("Orbi: não foi possível salvar", result.error);
        setState(previous);
      }
      router.refresh();
    });
  }

  function toggleWatched() {
    if (state.watched && state.hasDetails && !confirming)
      return setConfirming(true);
    setConfirming(false);
    save(state.watched ? EMPTY : { ...state, watched: true, watchlist: false });
  }

  // Curtir também marca como visto, como no Letterboxd.
  const toggleLike = () =>
    save({ ...state, watched: true, watchlist: false, liked: !state.liked });

  // Watchlist só vale para o que ainda não foi visto.
  const toggleWatchlist = () => save({ ...EMPTY, watchlist: !state.watchlist });

  const button =
    "grid size-7 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-40";

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-md opacity-0 ring-2 transition group-hover:opacity-100 ${
          state.watched ? "ring-ok" : "ring-fg"
        }`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={toggleWatched}
            disabled={pending}
            aria-pressed={state.watched}
            title={
              confirming
                ? t.movie.confirmRemove
                : state.watched
                  ? t.movie.watched
                  : t.movie.watch
            }
            className={`${button} ${confirming ? "bg-danger/30 text-danger" : state.watched ? "text-ok" : "text-white/70 hover:text-white"}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path
                d={
                  confirming ? "M6 6l12 12M18 6L6 18" : "M5 12.5l4.5 4.5L19 7.5"
                }
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleLike}
            disabled={pending}
            aria-pressed={state.liked}
            title={state.liked ? t.movie.liked : t.movie.like}
            className={`${button} ${state.liked ? "text-like" : "text-white/70 hover:text-white"}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill={state.liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
            </svg>
          </button>
          {/* Watchlist é só para o que ainda não foi visto: some depois de marcar como assistido */}
          {!state.watched && (
            <button
              type="button"
              onClick={toggleWatchlist}
              disabled={pending}
              aria-pressed={state.watchlist}
              title={t.movies.tabs.watchlist}
              className={`${button} ${state.watchlist ? "bg-white/15 text-white" : "text-white/70 hover:text-white"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
