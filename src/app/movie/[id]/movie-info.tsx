"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/components/i18n";
import type { CrewRole, WatchKind, WatchProvider } from "@/lib/tmdb";

// Um nome da ficha; com href, vira link para a busca (ex.: todos os filmes do diretor).
export type InfoChip = { name: string; href?: string };

// Tudo já vem formatado do servidor (nomes de países/idiomas e datas no idioma do usuário).
export type MovieInfoView = {
  cast: (InfoChip & { character: string })[];
  characters?: InfoChip[]; // anime e mangá: personagens (o elenco são os dubladores)
  crew: { role: CrewRole; people: InfoChip[] }[];
  details: { label: string; values: InfoChip[] }[];
  genres: InfoChip[];
  releases: { country: string; date: string; certification: string }[];
  // Onde assistir no país da pessoa (null = o TMDB não tem dados de nenhum país para o filme)
  watch: { country: string; link: string | null; groups: { kind: WatchKind; providers: WatchProvider[] }[] } | null;
};

type Tab = "cast" | "characters" | "crew" | "details" | "genres" | "releases" | "watch";
const CAST_PREVIEW = 24;

// Os textos vêm do dicionário no próprio navegador: alguns são funções (ex.: watchIn(país)),
// e funções não podem ser enviadas do servidor para um componente cliente.
export function MovieInfo({ info }: { info: MovieInfoView }) {
  const labels = useI18n().t.info;
  const tabs = (["cast", "characters", "crew", "details", "genres", "releases", "watch"] as const).filter((tab) =>
    tab === "characters"
      ? info.characters?.length
      : tab === "crew"
      ? info.crew.length
      : tab === "details"
        ? info.details.length
        : tab === "watch"
          ? info.watch
          : info[tab].length,
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

      {tab === "characters" && (
        <div className="flex flex-wrap gap-1.5">
          {(info.characters ?? []).map((c, i) => (
            <Chip key={`${c.name}-${i}`} href={c.href}>
              {c.name}
            </Chip>
          ))}
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

      {tab === "watch" && info.watch && <WhereToWatch watch={info.watch} labels={labels} />}

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

// Onde assistir: uma linha por tipo (streaming, grátis, com anúncios, aluguel, compra) com os logos dos serviços.
// Os links levam à página do TMDB/JustWatch do país, que tem os links diretos de cada serviço.
function WhereToWatch({ watch, labels }: { watch: NonNullable<MovieInfoView["watch"]>; labels: Dictionary["info"] }) {
  return (
    <div className="space-y-4">
      {watch.groups.length ? (
        <dl className="space-y-3">
          {watch.groups.map((g) => (
            <div key={g.kind} className="grid grid-cols-[minmax(0,10rem)_1fr] items-start gap-3">
              <dt className="flex items-center gap-2 pt-2 text-[11px] tracking-widest text-muted uppercase">
                <span className="shrink-0">{labels.watchKinds[g.kind]}</span>
                <span className="mt-1 h-px flex-1 border-b border-dotted border-muted/50" />
              </dt>
              <dd className="flex flex-wrap gap-2">
                {g.providers.map((p) => (
                  <a
                    key={p.id}
                    href={watch.link ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    title={p.name}
                    className="flex items-center gap-2 rounded-lg bg-surface-2 py-1 ps-1 pe-3 text-sm text-fg/85 transition hover:bg-border hover:text-fg"
                  >
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- logo pequeno direto do CDN do TMDB
                      <img src={`https://image.tmdb.org/t/p/w92${p.logo}`} alt="" className="size-7 rounded-md" loading="lazy" />
                    ) : (
                      <span className="size-7 rounded-md bg-border" />
                    )}
                    {p.name}
                  </a>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted">{labels.watchNone(watch.country)}</p>
      )}
      <p className="text-xs text-muted">
        {labels.watchIn(watch.country)} ·{" "}
        <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="hover:text-fg hover:underline">
          {labels.watchSource}
        </a>
      </p>
    </div>
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
