"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n";
import { parseLetterboxdExport, type LetterboxdFilm } from "@/lib/letterboxd";

const BATCH = 25;

type State =
  | { step: "idle"; error?: string }
  | { step: "ready"; films: LetterboxdFilm[] }
  | { step: "running"; films: LetterboxdFilm[]; done: number }
  | { step: "finished"; imported: number; notFound: string[]; error?: string };

export function LetterboxdImporter({ username }: { username: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ step: "idle" });

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const films = parseLetterboxdExport(new Uint8Array(await file.arrayBuffer()));
      setState({ step: "ready", films });
    } catch {
      setState({ step: "idle", error: t.import.invalid });
    }
  }

  async function run(films: LetterboxdFilm[]) {
    let imported = 0;
    const notFound: string[] = [];
    setState({ step: "running", films, done: 0 });

    for (let i = 0; i < films.length; i += BATCH) {
      const res = await fetch("/api/import/letterboxd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ films: films.slice(i, i + BATCH) }),
      }).catch(() => null);

      if (!res?.ok) {
        setState({ step: "finished", imported, notFound, error: t.import.error });
        return;
      }
      const data: { imported: number; notFound: string[] } = await res.json();
      imported += data.imported;
      notFound.push(...data.notFound);
      setState({ step: "running", films, done: Math.min(i + BATCH, films.length) });
    }

    setState({ step: "finished", imported, notFound });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      {(state.step === "idle" || state.step === "ready") && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-10 text-center hover:border-accent">
          <span className="font-semibold">{t.import.choose}</span>
          <span className="text-xs text-muted">letterboxd-*.zip</span>
          <input type="file" accept=".zip,application/zip" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      )}

      {state.step === "idle" && state.error && <p className="text-sm text-like">{state.error}</p>}

      {state.step === "ready" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">{t.import.found(state.films.length)}</p>
          <button
            onClick={() => run(state.films)}
            disabled={!state.films.length}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
          >
            {t.import.start}
          </button>
        </div>
      )}

      {state.step === "running" && (
        <div className="space-y-2">
          <p className="text-sm">{t.import.progress(state.done, state.films.length)}</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(state.done / state.films.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {state.step === "finished" && (
        <div className="space-y-3 text-sm">
          {state.error && <p className="text-like">{state.error}</p>}
          <p className="text-ok">{t.import.done(state.imported)}</p>
          <Link href={`/u/${username}/movies`} className="inline-block font-semibold text-accent hover:underline">
            → /u/{username}/movies
          </Link>
          {state.notFound.length > 0 && (
            <div>
              <p className="mb-2 text-muted">{t.import.notFound}</p>
              <ul className="max-h-64 list-inside list-disc overflow-y-auto rounded-lg bg-bg p-3 text-xs text-muted">
                {state.notFound.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
