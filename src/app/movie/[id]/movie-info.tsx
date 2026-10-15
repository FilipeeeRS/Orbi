"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CrewRole } from "@/lib/tmdb";

// Um nome da ficha; com href, vira link para a busca (ex.: todos os filmes do diretor).
export type InfoChip = { name: string; href?: string };

// Tudo já vem formatado do servidor (nomes de países/idiomas e datas no idioma do usuário).
export type MovieInfoView = {
  cast: (InfoChip & { character: string })[];
  crew: { role: CrewRole; people: InfoChip[] }[];
  details: { label: string; values: InfoChip[] }[];
  genres: InfoChip[];
  releases: { country: string; date: string; certification: string }[];
};

type Tab = "cast" | "crew" | "details" | "genres" | "releases";
const CAST_PREVIEW = 24;

export function MovieInfo({ info, labels }: { info: MovieInfoView; labels: Dictionary["info"] }) {
  const tabs = (["cast", "crew", "details", "genres", "releases"] as const).filter((tab) =>
    tab === "crew" ? info.crew.length : tab === "details" ? info.details.length : info[tab].length,
  );
  const [tab, setTab] = useState<Tab>(tabs[0] ?? "cast");
  const [allCast, setAllCast] = useState(false);
  if (!tabs.length) return null;

  const cast = allCast ? info.cast : info.cast.slice(0, CAST_PREVIEW);

  return (
    <section>
      <nav className="mb-4 flex gap-5 overflow-x-auto border-b border-border [scrollbar-width:none]" role="tablist">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === tab}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-2 text-xs font-semibold tracking-widest whitespace-nowrap uppercase transition ${
              key === tab ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {labels[key]}
          </button>
        ))}
      </nav>

      {tab === "cast" && (
        <div className="flex flex-wrap gap-1.5">
          {cast.map((p, i) => (
            <Chip key={`${p.name}-${i}`} href={p.href} title={p.character || undefined}>
              {p.name}
            </Chip>
          ))}
          {!allCast && info.cast.length > CAST_PREVIEW && (
            <button
              type="button"
              onClick={() => setAllCast(true)}
              className="rounded-md bg-surface-2 px-2.5 py-1 text-sm text-accent hover:bg-border"
            >
              {labels.showAll} ({info.cast.length})
            </button>
          )}
        </div>
      )}

      {tab === "crew" && (
        <Rows rows={info.crew.map((c) => ({ label: labels[c.role], values: c.people }))} />
      )}

      {tab === "details" && <Rows rows={info.details} />}

      {tab === "genres" && (
        <div className="flex flex-wrap gap-1.5">
          {info.genres.map((g) => (
            <Chip key={g.name} href={g.href}>
              {g.name}
            </Chip>
          ))}
        </div>
      )}

      {tab === "releases" && (
        <ul className="divide-y divide-border/60 text-sm">
          {info.releases.map((r) => (
            <li key={r.country} className="flex items-center justify-between gap-3 py-1.5">
              <span className="w-28 shrink-0 text-xs text-muted tabular-nums">{r.date}</span>
              <span className="flex-1 truncate">{r.country}</span>
              {r.certification && (
                <span className="rounded border border-border px-1.5 text-[10px] font-semibold text-muted">
                  {r.certification}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Linhas "RÓTULO ........ valor valor", como na ficha do Letterboxd.
function Rows({ rows }: { rows: { label: string; values: InfoChip[] }[] }) {
  return (
    <dl className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,10rem)_1fr] items-start gap-3">
          <dt className="flex items-center gap-2 pt-1 text-[11px] tracking-widest text-muted uppercase">
            <span className="shrink-0">{row.label}</span>
            <span className="mt-1 h-px flex-1 border-b border-dotted border-muted/50" />
          </dt>
          <dd className="flex flex-wrap gap-1.5">
            {row.values.map((v) => (
              <Chip key={v.name} href={v.href}>
                {v.name}
              </Chip>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Chip({ children, title, href }: { children: React.ReactNode; title?: string; href?: string }) {
  const className = "rounded-md bg-surface-2 px-2.5 py-1 text-sm text-fg/85";
  return href ? (
    <Link href={href} title={title} className={`${className} transition hover:bg-border hover:text-fg`}>
      {children}
    </Link>
  ) : (
    <span title={title} className={className}>
      {children}
    </span>
  );
}
