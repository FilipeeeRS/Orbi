"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";
import { StarIcon } from "@/components/stars";
import type { Entry } from "@/lib/types";

type Draft = Pick<Entry, "status" | "rating" | "liked" | "review" | "watched_on">;

const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD no fuso local

// Grava direto no Supabase (RLS garante que só o dono escreve). O mesmo fluxo serve para um app mobile.
export function EntryEditor({ itemId, userId, initial }: { itemId: string; userId: string; initial: Entry | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [entry, setEntry] = useState<Draft | null>(initial);
  const [review, setReview] = useState(initial?.review ?? "");
  const [watchedOn, setWatchedOn] = useState(initial?.watched_on ?? "");
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const watched = entry?.status === "watched";
  const onWatchlist = entry?.status === "watchlist";

  function persist(next: Draft | null, previous: Draft | null) {
    setEntry(next);
    setError(false);
    start(async () => {
      const supabase = createClient();
      const { error } = next
        ? await supabase
            .from("entries")
            .upsert({ user_id: userId, item_id: itemId, ...next }, { onConflict: "user_id,item_id" })
        : await supabase.from("entries").delete().eq("user_id", userId).eq("item_id", itemId);
      if (error) {
        setEntry(previous);
        setError(true);
        return;
      }
      router.refresh();
    });
  }

  // Nota, like e review marcam como assistido, como no Letterboxd.
  function asWatched(patch: Partial<Draft>): Draft {
    const base: Draft =
      entry?.status === "watched"
        ? entry
        : { status: "watched", rating: null, liked: false, review: null, watched_on: watchedOn || today() };
    return { ...base, ...patch };
  }

  function toggleWatched() {
    if (!watched) {
      const next = asWatched({});
      setWatchedOn(next.watched_on ?? "");
      return persist(next, entry);
    }
    if ((entry?.rating || entry?.liked || entry?.review) && !confirm(t.movie.confirmRemove)) return;
    setReview("");
    setWatchedOn("");
    persist(null, entry);
  }

  function toggleWatchlist() {
    persist(onWatchlist ? null : { status: "watchlist", rating: null, liked: false, review: null, watched_on: null }, entry);
  }

  function rate(value: number) {
    const next = asWatched({ rating: entry?.rating === value ? null : value });
    setWatchedOn(next.watched_on ?? "");
    persist(next, entry);
  }

  function saveDetails() {
    const next = asWatched({ review: review.trim() || null, watched_on: watchedOn || null });
    persist(next, entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const shown = hover ?? entry?.rating ?? 0;
  const dirty = (review.trim() || null) !== (entry?.review ?? null) || (watchedOn || null) !== (entry?.watched_on ?? null);

  return (
    <div className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap gap-2">
        <Toggle on={watched} onClick={toggleWatched} disabled={pending} tone="ok">
          {watched ? `✓ ${t.movie.watched}` : t.movie.watch}
        </Toggle>
        {!watched && (
          <Toggle on={onWatchlist} onClick={toggleWatchlist} disabled={pending} tone="accent">
            {onWatchlist ? `✓ ${t.movie.watchlist}` : `+ ${t.movie.addWatchlist}`}
          </Toggle>
        )}
        <Toggle on={!!entry?.liked} onClick={() => persist(asWatched({ liked: !entry?.liked }), entry)} disabled={pending} tone="like">
          {entry?.liked ? `♥ ${t.movie.liked}` : `♡ ${t.movie.like}`}
        </Toggle>
      </div>

      <div>
        <p className="mb-1 text-xs text-muted">{t.movie.rating}</p>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label={t.movie.rating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="relative size-9">
                <StarIcon fill={shown >= star * 2 ? 1 : shown === star * 2 - 1 ? 0.5 : 0} />
                {[star * 2 - 1, star * 2].map((value, half) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={entry?.rating === value}
                    aria-label={`${value / 2}`}
                    disabled={pending}
                    onMouseEnter={() => setHover(value)}
                    onFocus={() => setHover(value)}
                    onBlur={() => setHover(null)}
                    onClick={() => rate(value)}
                    className={`absolute top-0 h-full w-1/2 cursor-pointer ${half ? "right-0" : "left-0"}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <span className="w-8 text-sm text-muted tabular-nums">{shown ? (shown / 2).toLocaleString() : ""}</span>
          {entry?.rating && (
            <button type="button" onClick={() => rate(entry.rating!)} className="text-xs text-muted hover:text-fg">
              {t.movie.clearRating}
            </button>
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-muted">{t.movie.review}</span>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={20000}
          rows={4}
          placeholder={t.movie.reviewPlaceholder}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-xs text-muted">
          <span className="mb-1 block">{t.movie.watchedOn}</span>
          <input
            type="date"
            value={watchedOn}
            max={today()}
            onChange={(e) => setWatchedOn(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-danger">{t.common.error}</span>}
          {saved && !error && <span className="text-sm text-ok">{t.movie.saved}</span>}
          <button
            type="button"
            onClick={saveDetails}
            disabled={pending || !dirty}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
          >
            {t.movie.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  on,
  tone,
  children,
  ...props
}: { on: boolean; tone: "ok" | "accent" | "like" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const active = { ok: "border-ok text-ok", accent: "border-accent text-accent", like: "border-like text-like" }[tone];
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        on ? `${active} bg-surface-2` : "border-border text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
