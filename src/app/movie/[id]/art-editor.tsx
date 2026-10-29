"use client";

import { useI18n } from "@/components/i18n";
import { useEffect, useState, useTransition } from "react";
import { listMovieImages, saveItemArt } from "./art-actions";

const IMG = "https://image.tmdb.org/t/p";

type Labels = { edit: string; poster: string; backdrop: string; reset: string; empty: string; hint: string };

// "Editar imagens": escolhe outro pôster e outro fundo entre as imagens do TMDB.
// Só para filmes vistos. A escolha é pessoal: a pessoa vê as imagens dela em todo o site; os outros veem o padrão.
export function ArtEditor({
  itemId,
  currentPoster,
  currentBackdrop,
  labels,
}: {
  itemId: string;
  currentPoster: string | null; // URL em uso (para marcar a escolhida)
  currentBackdrop: string | null;
  labels: Labels;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"poster" | "backdrop">("poster");
  const [images, setImages] = useState<{ posters: string[]; backdrops: string[] } | null>(null);
  const [selected, setSelected] = useState({ poster: pathOf(currentPoster), backdrop: pathOf(currentBackdrop) });
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (!images) listMovieImages(itemId).then(setImages);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, images, itemId]);

  function choose(path: string | null) {
    const previous = selected[tab];
    setSelected((s) => ({ ...s, [tab]: path }));
    start(async () => {
      const { ok } = await saveItemArt(itemId, tab, path);
      if (!ok) setSelected((s) => ({ ...s, [tab]: previous }));
    });
  }

  const list = tab === "poster" ? images?.posters : images?.backdrops;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="m21 16-5-5-9 9" />
        </svg>
        {labels.edit}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.edit}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div className="flex gap-1">
                {(["poster", "backdrop"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      tab === k ? "bg-fg text-bg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {labels[k]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => choose(null)}
                  disabled={pending || !selected[tab]}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40"
                >
                  {labels.reset}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.report.close}
                  className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              {!list ? (
                <div className={`grid gap-3 ${tab === "poster" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className={`animate-pulse rounded-md bg-surface-2 ${tab === "poster" ? "aspect-[2/3]" : "aspect-video"}`} />
                  ))}
                </div>
              ) : list.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">{labels.empty}</p>
              ) : (
                <div className={`grid gap-3 ${tab === "poster" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {list.map((path) => {
                    const active = selected[tab] === path;
                    return (
                      <button
                        key={path}
                        type="button"
                        onClick={() => choose(path)}
                        disabled={pending}
                        className={`relative overflow-hidden rounded-md ring-offset-2 ring-offset-surface transition ${
                          active ? "ring-2 ring-accent" : "ring-1 ring-border hover:ring-2 hover:ring-fg"
                        } ${tab === "poster" ? "aspect-[2/3]" : "aspect-video"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas direto do CDN do TMDB */}
                        <img
                          src={`${IMG}/${tab === "poster" ? "w185" : "w300"}${path}`}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                        {active && (
                          <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-accent text-accent-fg shadow">
                            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="border-t border-border px-5 py-3 text-xs text-muted">{labels.hint}</p>
          </div>
        </div>
      )}
    </>
  );
}

// "https://image.tmdb.org/t/p/w500/abc.jpg" → "/abc.jpg" (null se não for do TMDB)
function pathOf(url: string | null) {
  const match = url?.match(/image\.tmdb\.org\/t\/p\/[a-z0-9]+(\/[A-Za-z0-9_-]+\.(?:jpg|png))$/);
  return match ? match[1] : null;
}
