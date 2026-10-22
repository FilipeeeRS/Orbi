"use client";

import { useEffect, useRef, useState } from "react";
import { useSaveQueue } from "@/lib/use-save-queue";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "./i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { ensureTmdbItemId } from "@/app/actions";

export type ViewerItemState = {
  watched: boolean;
  liked: boolean;
  watchlist: boolean;
  watching?: boolean; // só séries
  hasDetails: boolean;
  rating?: number | null; // nota do próprio usuário, 1..10
};

const EMPTY: ViewerItemState = {
  watched: false,
  liked: false,
  watchlist: false,
  watching: false,
  hasDetails: false,
};
const today = () => new Date().toLocaleDateString("sv-SE");

// Atalhos sobre o pôster (✓ visto, ▶ assistindo (séries), ♥ curtir, 🕐 watchlist) e a borda de hover, que fica verde
// quando o usuário logado já viu o filme. Tudo usa o estado atual, então muda na hora do clique.
// Sem itemId (filme/série do TMDB fora do catálogo), o tmdb cria o item no primeiro clique.
export function PosterActions({
  itemId,
  tmdb,
  viewerId,
  initial,
  series = false,
  unreleased = false,
  badge: showBadge = true,
  verb = "watch",
}: {
  itemId: string | null;
  tmdb?: { type: "movie" | "tv" | "anime" | "manga" | "book" | "game"; id: number | string }; // id na fonte
  viewerId: string;
  initial: ViewerItemState | null;
  series?: boolean; // séries ganham o "Assistindo"
  unreleased?: boolean; // ainda não lançado: só o relógio (watchlist)
  badge?: boolean; // selo do status no canto (no perfil fica de fora: a pasta já diz o status)
  verb?: "watch" | "read" | "play"; // livros e mangás: Ler/Lido/Lendo; jogos: Jogar/Jogado/Jogando
}) {
  const { t, locale } = useI18n();
  // Nomes do status conforme a pasta (o like é igual em todas)
  const words =
    verb === "read"
      ? { done: t.manga.readDone, todo: t.manga.read, doing: t.manga.reading }
      : verb === "play"
        ? { done: t.game.played, todo: t.game.play, doing: t.game.playing }
        : { done: t.movie.watched, todo: t.movie.watch, doing: t.movies.tabs.watching };
  const lang = dictionaries[locale].htmlLang;
  const [state, setState] = useState<ViewerItemState>(initial ?? EMPTY);
  // Desmarcar um filme com nota/review pede um segundo clique (em vez de um confirm do navegador).
  const [confirming, setConfirming] = useState(false);
  const enqueue = useSaveQueue();
  const idRef = useRef(itemId);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  function save(next: ViewerItemState) {
    const previous = state;
    setState(next);
    enqueue(async () => {
      const id = idRef.current ?? (tmdb ? await ensureTmdbItemId(tmdb.type, tmdb.id) : null);
      if (!id) {
        setState(previous);
        return;
      }
      idRef.current = id;
      const supabase = createClient();
      let result;
      if (next.watched) {
        // Upsert parcial: só mexe nas colunas enviadas, então nota e review continuam como estão.
        result = await supabase.from("entries").upsert(
          {
            user_id: viewerId,
            item_id: id,
            status: "watched",
            liked: next.liked,
            ...(previous.watched ? {} : { watched_on: today() }),
          },
          { onConflict: "user_id,item_id" },
        );
      } else if (next.watching) {
        result = await supabase
          .from("entries")
          .upsert(
            {
              user_id: viewerId,
              item_id: id,
              status: "watching",
              liked: false,
              rating: null,
              review: null,
              watched_on: null,
            },
            { onConflict: "user_id,item_id" },
          );
      } else if (next.watchlist) {
        result = await supabase
          .from("entries")
          .upsert(
            {
              user_id: viewerId,
              item_id: id,
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
          .eq("item_id", id);
      }
      if (result.error) {
        console.error("Orbi: não foi possível salvar", result.error);
        setState(previous);
      }
    });
  }

  function toggleWatched() {
    if (state.watched && state.hasDetails && !confirming)
      return setConfirming(true);
    setConfirming(false);
    save(state.watched ? EMPTY : { ...state, watched: true, watchlist: false, watching: false });
  }

  // Curtir também marca como visto, como no Letterboxd.
  const toggleLike = () =>
    save({ ...state, watched: true, watchlist: false, watching: false, liked: !state.liked });

  // Watchlist só vale para o que ainda não foi visto.
  const toggleWatchlist = () => save({ ...EMPTY, watchlist: !state.watchlist });
  const toggleWatching = () => save({ ...EMPTY, watching: !state.watching });

  const button =
    "grid size-7 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-40";

  // Selo do status atual no canto do pôster, sempre visível (sem passar o mouse): fundo escuro, ícone na cor do status.
  const badge = state.watched
    ? { label: words.done, className: "text-ok", icon: <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="3.2" /> }
    : state.watching
      ? {
          label: words.doing,
          className: "text-white",
          icon: <path d="M8.5 6.5v11l9-5.5z" fill="currentColor" strokeWidth="1.5" />,
        }
      : state.watchlist
        ? {
            label: t.movies.tabs.watchlist,
            className: "text-white",
            icon: <path d="M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" strokeWidth="2.4" />,
          }
        : null;

  return (
    <>
      {/* Canto de cima: a nota que você deu (4,5 ★) ao lado do selo do status. Sem nota sua, só o selo. */}
      {((showBadge && badge) || (state.watched && state.rating)) && (
        <span className="pointer-events-none absolute end-1.5 top-1.5 flex items-center gap-1">
          {state.watched && state.rating ? (
            <span className="flex h-6 items-center gap-0.5 rounded-md bg-black/75 px-1.5 text-[11px] font-semibold text-white tabular-nums shadow-md">
              {(state.rating / 2).toLocaleString(lang, { maximumFractionDigits: 1 })}
              <span className="text-star">★</span>
            </span>
          ) : null}
          {showBadge && badge && (
            <span title={badge.label} className={`grid size-6 place-items-center rounded-md bg-black/75 shadow-md ${badge.className}`}>
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-label={badge.label}>
                {badge.icon}
              </svg>
            </span>
          )}
        </span>
      )}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-md opacity-0 ring-2 transition group-hover:opacity-100 ${
          state.watched ? "ring-ok" : "ring-fg"
        }`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 shadow-lg backdrop-blur">
          {/* Ainda não lançado: sem assistido, assistindo e like, só a watchlist */}
          {!unreleased && (
            <>
          <button
            type="button"
            onClick={toggleWatched}
            aria-pressed={state.watched}
            title={
              confirming
                ? t.movie.confirmRemove
                : state.watched
                  ? words.done
                  : words.todo
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
          {/* Assistindo (só séries): também some depois de marcar como assistido */}
          {series && !state.watched && (
            <button
              type="button"
              onClick={toggleWatching}
              aria-pressed={!!state.watching}
              title={words.doing}
              className={`${button} ${state.watching ? "bg-white/15 text-white" : "text-white/70 hover:text-white"}`}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
                <path d="M8.5 6.5v11l9-5.5z" fill="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={toggleLike}
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
            </>
          )}
          {/* Watchlist é só para o que ainda não foi visto: some depois de marcar como assistido */}
          {!state.watched && (
            <button
              type="button"
              onClick={toggleWatchlist}
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
