"use client";

import { useRef, useState, useTransition } from "react";
import { saveFavorites, searchFavoriteCandidates, type FavoriteCandidate, type FavoriteItem } from "@/app/actions";
import { useI18n } from "@/components/i18n";
import { PosterImage } from "@/components/poster";

const SLOTS = 4;

// Até 4 favoritos (de qualquer pasta) que aparecem no topo do perfil. Salva a cada mudança.
export function FavoritesEditor({ initial }: { initial: FavoriteItem[] }) {
  const { t } = useI18n();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FavoriteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, start] = useTransition();
  const dragFrom = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function persist(next: FavoriteItem[]) {
    setItems(next);
    start(async () => {
      await saveFavorites(next.map((i) => i.id));
    });
  }

  function search(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) return setResults([]);
    timer.current = setTimeout(async () => {
      setSearching(true);
      setResults(await searchFavoriteCandidates(value));
      setSearching(false);
    }, 300);
  }

  function add(candidate: FavoriteCandidate) {
    setQuery("");
    setResults([]);
    if (items.some((i) => i.id === candidate.id)) return;
    persist([...items, { id: candidate.id, title: candidate.title, poster_url: candidate.poster_url }].slice(0, SLOTS));
  }

  function drop(to: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === to || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist(next);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 text-sm">
      <p className="font-semibold">{t.settings.favorites}</p>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: SLOTS }, (_, i) => items[i]).map((item, i) =>
          item ? (
            <div
              key={item.id}
              draggable
              onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(i)}
              className="group relative cursor-grab active:cursor-grabbing"
            >
              <PosterImage url={item.poster_url} title={item.title} />
              <button
                type="button"
                onClick={() => persist(items.filter((x) => x.id !== item.id))}
                aria-label="×"
                className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-black/80 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              key={`empty-${i}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(items.length - 1)}
              className="grid aspect-[2/3] place-items-center rounded-md border border-dashed border-border text-lg text-muted"
            >
              +
            </div>
          ),
        )}
      </div>

      {items.length < SLOTS && (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={t.settings.favoritesSearch}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
          />
          {(results.length > 0 || searching) && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-xl">
              {searching && <li className="px-3 py-2 text-muted">{t.common.loading}</li>}
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => add(r)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-start hover:bg-surface-2"
                  >
                    <span className="w-7 shrink-0">
                      <PosterImage url={r.poster_url} title={r.title} />
                    </span>
                    <span className="truncate">
                      {r.title} {r.year && <span className="text-muted">{r.year}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className={`text-xs text-muted ${pending ? "animate-pulse" : ""}`}>{t.settings.favoritesHint}</p>
    </div>
  );
}
