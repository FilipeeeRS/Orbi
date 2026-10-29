"use client";

import Image from "next/image";
import { createContext, use, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n";
import { useToast } from "./toast";
import { quickLog } from "@/app/actions";
import type { Suggestion } from "@/lib/suggest";

type Work = Exclude<Suggestion, { type: "person" }> & { type: Exclude<Suggestion["type"], "person"> };

// "+ Registrar" de qualquer tela: busca a obra e grava nota, visto, like, data e review sem sair de onde está.
const QuickLogContext = createContext<{ open: () => void; signedIn: boolean }>({ open: () => {}, signedIn: false });

export function useQuickLog() {
  return use(QuickLogContext);
}

export function QuickLogProvider({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const router = useRouter();
  const open = () => (signedIn ? setOpen(true) : router.push("/login"));
  return (
    <QuickLogContext value={{ open, signedIn }}>
      {children}
      {isOpen && <QuickLogDialog onClose={() => setOpen(false)} />}
    </QuickLogContext>
  );
}

// Botão "+ Registrar" do topo (no celular fica na barra de baixo).
export function QuickLogButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const { open } = useQuickLog();
  return (
    <button
      type="button"
      onClick={open}
      className={`flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
      {t.quickLog.button}
    </button>
  );
}

const today = () => new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso local

function QuickLogDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; list: Work[] }>({ q: "", list: [] });
  const [work, setWork] = useState<Work | null>(null);
  const [status, setStatus] = useState<"watched" | "watchlist">("watched");
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [date, setDate] = useState(today());
  const [review, setReview] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  // Sugestões enquanto digita (as mesmas da busca do topo, sem pessoas)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((list: Suggestion[]) => setResults({ q, list: list.filter((s): s is Work => s.type !== "person") }))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const verb = work?.type === "book" || work?.type === "manga" ? "read" : work?.type === "game" ? "play" : "watch";
  const doneLabel = verb === "read" ? t.manga.readDone : verb === "play" ? t.game.played : t.movie.watched;
  const typeLabel = {
    movie: t.search.typeMovie,
    series: t.search.typeSeries,
    anime: t.search.typeAnime,
    manga: t.search.typeManga,
    book: t.search.typeBook,
    game: t.search.typeGame,
  };
  const list = query.trim().length >= 2 && results.q === query.trim() ? results.list : [];
  const shown = hover ?? rating ?? 0;

  function save() {
    if (!work) return;
    setError(false);
    start(async () => {
      const res = await quickLog({ type: work.type, id: work.id, status, rating, liked, watchedOn: date || null, review });
      if (!res.ok) return setError(true);
      ref.current?.close();
      toast({ message: t.quickLog.saved(work.title), action: res.href ? { label: t.quickLog.view, onClick: () => router.push(res.href!) } : undefined });
      router.refresh();
    });
  }

  const chip = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      on ? "border-fg bg-surface-2 text-fg" : "border-border text-muted hover:text-fg"
    }`;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={t.quickLog.title}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-lg font-bold">{t.quickLog.title}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={t.report.close}
          className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {!work ? (
        // Passo 1: achar a obra
        <div className="space-y-3 p-5">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.quickLog.search}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          {query.trim().length >= 2 && results.q === query.trim() && list.length === 0 && (
            <p className="px-1 py-4 text-center text-sm text-muted">{t.quickLog.empty}</p>
          )}
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {list.map((s) => (
              <li key={`${s.type}-${s.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    setWork(s);
                    setStatus("watched");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start hover:bg-surface-2"
                >
                  <Thumb url={s.image} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.title}</span>
                    <span className="text-xs text-muted">
                      {typeLabel[s.type]}
                      {s.year ? ` · ${s.year}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // Passo 2: registrar
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Thumb url={work.image} large />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-tight font-extrabold">{work.title}</p>
              <p className="text-xs text-muted">
                {typeLabel[work.type]}
                {work.year ? ` · ${work.year}` : ""}
              </p>
              <button type="button" onClick={() => setWork(null)} className="mt-1 text-xs text-accent hover:underline">
                {t.quickLog.change}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={status === "watched"} onClick={() => setStatus("watched")} className={chip(status === "watched")}>
              ✓ {doneLabel}
            </button>
            <button type="button" aria-pressed={status === "watchlist"} onClick={() => setStatus("watchlist")} className={chip(status === "watchlist")}>
              {t.movies.tabs.watchlist}
            </button>
            {status === "watched" && (
              <button
                type="button"
                aria-pressed={liked}
                onClick={() => setLiked(!liked)}
                className={`${chip(liked)} ${liked ? "border-like text-like" : ""}`}
              >
                ♥ {liked ? t.movie.liked : t.movie.like}
              </button>
            )}
          </div>

          {status === "watched" && (
            <>
              {/* Nota: meias estrelas; clicar na nota atual limpa */}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted">{t.movie.rating}</span>
                <div className="flex" role="radiogroup" aria-label={t.movie.rating} onMouseLeave={() => setHover(null)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative size-8">
                      <svg viewBox="0 0 24 24" className="size-8 text-border" aria-hidden>
                        <defs>
                          <linearGradient id={`ql-star-${star}`}>
                            <stop offset={shown >= star * 2 ? "100%" : shown === star * 2 - 1 ? "50%" : "0%"} stopColor="var(--star)" />
                            <stop offset="0" stopColor="currentColor" />
                          </linearGradient>
                        </defs>
                        <path fill={`url(#ql-star-${star})`} d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" />
                      </svg>
                      {[star * 2 - 1, star * 2].map((value, half) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={rating === value}
                          aria-label={`${value / 2}`}
                          onMouseEnter={() => setHover(value)}
                          onClick={() => setRating(rating === value ? null : value)}
                          className={`absolute top-0 h-full w-1/2 cursor-pointer ${half ? "end-0" : "start-0"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted tabular-nums">{shown ? (shown / 2).toLocaleString() : ""}</span>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-24 text-muted">{t.movie.watchedOn}</span>
                <input
                  type="date"
                  value={date}
                  max={today()}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-1.5 outline-none focus:border-accent"
                />
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={10000}
                placeholder={t.movie.reviewPlaceholder}
                className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            {error && <span className="me-auto text-sm text-danger">{t.common.error}</span>}
            <button type="button" onClick={() => ref.current?.close()} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
              {t.lists.cancel}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
            >
              {pending ? t.lists.saving : t.movie.save}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

function Thumb({ url, large }: { url: string | null; large?: boolean }) {
  const size = large ? "h-24 w-16" : "h-14 w-10";
  return url ? (
    <Image src={url} alt="" width={large ? 64 : 40} height={large ? 96 : 56} className={`${size} shrink-0 rounded object-cover`} />
  ) : (
    <span className={`${size} shrink-0 rounded bg-surface-2`} />
  );
}
