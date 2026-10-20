"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";
import { ensureSeasonId } from "@/app/actions";

export type EpisodeView = {
  number: number;
  name: string;
  overview: string;
  date: string | null; // já formatada no idioma da pessoa
  aired: boolean;
  runtime: number | null;
  still: string | null;
};

const today = () => new Date().toLocaleDateString("sv-SE");

// Grava episódios vistos/desmarcados de uma temporada e mantém os status em dia: marcar põe a
// temporada e a série em "Assistindo" (se ainda não tinham status) e atualiza o "Parei em" da série;
// ver o último que faltava marca a temporada como assistida. A temporada vira item no catálogo no
// primeiro clique. Devolve o id da temporada, ou null se não deu para salvar.
export async function persistEpisodes({
  userId,
  seasonItemId,
  seriesItemId,
  tmdb,
  added,
  removed,
  completesSeason,
}: {
  userId: string;
  seasonItemId: string | null;
  seriesItemId: string;
  tmdb: { show: number; season: number };
  added: number[];
  removed: number[];
  completesSeason: boolean; // com isso, todos os episódios da temporada ficam vistos
}): Promise<string | null> {
  const seasonId = seasonItemId ?? (await ensureSeasonId(tmdb.show, tmdb.season));
  if (!seasonId) return null;
  const supabase = createClient();
  const results = await Promise.all([
    added.length
      ? supabase
          .from("episode_watches")
          .upsert(
            added.map((n) => ({ user_id: userId, item_id: seasonId, episode_number: n, watched_on: today() })),
            { onConflict: "user_id,item_id,episode_number", ignoreDuplicates: true },
          )
      : null,
    removed.length
      ? supabase.from("episode_watches").delete().eq("user_id", userId).eq("item_id", seasonId).in("episode_number", removed)
      : null,
  ]);
  if (results.some((r) => r?.error)) {
    console.error("Orbi: não foi possível salvar os episódios", results.find((r) => r?.error)?.error);
    return null;
  }
  if (completesSeason) {
    await supabase
      .from("entries")
      .upsert({ user_id: userId, item_id: seasonId, status: "watched", watched_on: today() }, { onConflict: "user_id,item_id" });
  }
  if (added.length) {
    const watching = (itemId: string) => ({ user_id: userId, item_id: itemId, status: "watching" });
    await supabase
      .from("entries")
      .upsert([watching(seasonId), watching(seriesItemId)], { onConflict: "user_id,item_id", ignoreDuplicates: true });
    // "Parei em": o último episódio marcado agora (só enquanto a série está em Assistindo).
    await supabase
      .from("entries")
      .update({ current_season: tmdb.season, current_episode: Math.max(...added) })
      .eq("user_id", userId)
      .eq("item_id", seriesItemId)
      .eq("status", "watching");
  }
  return seasonId;
}

// Episódios da temporada com o "visto" de cada um. Na página da série a lista é controlada de fora
// (watched + onWatchedChange), para o total e o "Próximo episódio" acompanharem na hora.
export function EpisodeList({
  seasonItemId,
  seriesItemId,
  tmdb,
  userId,
  seasonWatched,
  initialWatched,
  episodes,
  embedded = false,
  watched: controlled,
  onWatchedChange,
  onSeasonId,
}: {
  seasonItemId: string | null;
  seriesItemId: string;
  tmdb: { show: number; season: number };
  userId: string | null;
  seasonWatched: boolean;
  initialWatched: number[];
  episodes: EpisodeView[];
  embedded?: boolean;
  watched?: number[];
  onWatchedChange?: (watched: number[]) => void;
  onSeasonId?: (id: string) => void; // temporada criada no catálogo no primeiro clique
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [local, setLocal] = useState(() => new Set(initialWatched));
  const watched = controlled ? new Set(controlled) : local;
  const setWatched = (next: Set<number>) => (controlled ? onWatchedChange?.([...next]) : setLocal(next));
  const [pending, start] = useTransition();
  const seasonRef = useRef(seasonItemId);
  const allWatched = episodes.every((e) => watched.has(e.number));

  function save(next: Set<number>, added: number[], removed: number[]) {
    if (!userId) return;
    const previous = watched;
    setWatched(next);
    start(async () => {
      const seasonId = await persistEpisodes({
        userId,
        seasonItemId: seasonRef.current,
        seriesItemId,
        tmdb,
        added,
        removed,
        completesSeason: !seasonWatched && episodes.every((e) => next.has(e.number)),
      });
      if (!seasonId) {
        setWatched(previous);
        return;
      }
      if (!seasonRef.current) onSeasonId?.(seasonId);
      seasonRef.current = seasonId;
      router.refresh();
    });
  }

  function toggle(n: number) {
    const next = new Set(watched);
    if (next.has(n)) {
      next.delete(n);
      save(next, [], [n]);
    } else {
      next.add(n);
      save(next, [n], []);
    }
  }

  function toggleAll() {
    if (allWatched) save(new Set(), [], [...watched]);
    else {
      const missing = episodes.map((e) => e.number).filter((n) => !watched.has(n));
      save(new Set([...watched, ...missing]), missing, []);
    }
  }

  return (
    <section>
      <div className={`mb-3 flex items-end justify-between gap-3 ${embedded ? "" : "border-b border-border pb-2"}`}>
        <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">
          {!embedded && t.series.episodes}
          {userId && (
            <span className={`font-normal tracking-normal normal-case ${embedded ? "" : "ms-2"}`}>
              {t.series.progress(episodes.filter((e) => watched.has(e.number)).length, episodes.length)}
            </span>
          )}
        </h2>
        {userId && (
          <button
            type="button"
            onClick={toggleAll}
            disabled={pending}
            className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
          >
            {allWatched ? t.series.unmarkAll : t.series.markAll}
          </button>
        )}
      </div>
      <ol className="divide-y divide-border">
        {episodes.map((e) => {
          const seen = watched.has(e.number);
          return (
            <li key={e.number} className={`flex items-start gap-4 py-3 ${e.aired ? "" : "opacity-60"}`}>
              <div className="relative hidden aspect-video w-36 shrink-0 overflow-hidden rounded bg-surface-2 sm:block">
                {e.still && <Image src={e.still} alt="" fill sizes="144px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  <span className="me-2 text-muted tabular-nums">{e.number}</span>
                  {e.name}
                </p>
                <p className="text-xs text-muted">
                  {[e.date, e.runtime ? `${e.runtime} min` : null].filter(Boolean).join(" · ")}
                </p>
                {e.overview && <p className="mt-1 line-clamp-2 text-sm text-muted">{e.overview}</p>}
              </div>
              {userId && (
                <button
                  type="button"
                  onClick={() => toggle(e.number)}
                  disabled={pending}
                  aria-pressed={seen}
                  title={seen ? t.movie.watched : t.movie.watch}
                  className={`grid size-8 shrink-0 place-items-center rounded-full border transition disabled:opacity-50 ${
                    seen ? "border-ok bg-ok text-bg" : "border-border text-muted hover:border-ok hover:text-ok"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
