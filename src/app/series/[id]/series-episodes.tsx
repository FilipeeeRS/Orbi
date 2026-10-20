"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n";
import { EpisodeList, persistEpisodes, type EpisodeView } from "./season/[n]/episode-list";

export type SeasonView = {
  number: number;
  name: string;
  itemId: string | null; // null = temporada ainda fora do catálogo
  watched: number[]; // episódios que a pessoa já viu
  seasonWatched: boolean;
  episodes: (EpisodeView & { rating: number | null })[];
};

// Faixas da legenda, da melhor para a pior (nota mínima de cada uma).
const SCALE = [
  { key: "awesome", min: 9, className: "bg-[#1e7a46] text-white" },
  { key: "great", min: 8, className: "bg-[#3fae5f] text-white" },
  { key: "good", min: 7, className: "bg-[#e8c33a] text-black" },
  { key: "regular", min: 6, className: "bg-[#ec8f2e] text-black" },
  { key: "bad", min: 0, className: "bg-[#d9443f] text-white" },
] as const;

const band = (rating: number) => SCALE.find((b) => rating >= b.min)!;

// Abas da série, sem sair da página: tabela de notas dos episódios (média do TMDB) e a lista de
// episódios de cada temporada para marcar o que já viu. Clicar numa nota abre a temporada na lista.
export function SeriesEpisodes({
  showId,
  seriesItemId,
  userId,
  seasons,
}: {
  showId: number;
  seriesItemId: string;
  userId: string | null;
  seasons: SeasonView[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [marking, startMarking] = useTransition();
  // Temporadas criadas no catálogo durante a visita (o primeiro clique cria) e as que já ficaram completas.
  const [seasonIds, setSeasonIds] = useState(() => new Map(seasons.map((s) => [s.number, s.itemId])));
  const [seasonsDone, setSeasonsDone] = useState(() => new Set(seasons.filter((s) => s.seasonWatched).map((s) => s.number)));
  const rated = seasons.filter((s) => s.number > 0 && s.episodes.some((e) => e.rating !== null));
  const [tab, setTab] = useState<"ratings" | "episodes">(rated.length ? "ratings" : "episodes");
  // Vistos por temporada (atualiza na hora em que um episódio é marcado), para o total da série.
  const [watchedBy, setWatchedBy] = useState(() => new Map(seasons.map((s) => [s.number, s.watched])));
  const [selected, setSelected] = useState(seasons.find((s) => s.number > 0)?.number ?? seasons[0]?.number ?? 1);
  if (!seasons.length) return null;

  // Total da série sem os especiais (temporada 0).
  const regular = seasons.filter((s) => s.number > 0);
  const totalEpisodes = regular.reduce((sum, s) => sum + s.episodes.length, 0);
  const totalWatched = regular.reduce(
    (sum, s) => sum + (watchedBy.get(s.number) ?? []).filter((n) => s.episodes.some((e) => e.number === n)).length,
    0,
  );
  const current = seasons.find((s) => s.number === selected) ?? seasons[0];
  const setWatched = (season: number, list: number[]) => setWatchedBy((m) => new Map(m).set(season, list));

  // "Próximo episódio": o primeiro já lançado que a pessoa ainda não viu, em ordem (só depois de começar).
  const next =
    userId && totalWatched > 0
      ? regular
          .flatMap((s) => s.episodes.map((e) => ({ season: s, episode: e })))
          .find(({ season, episode }) => episode.aired && !(watchedBy.get(season.number) ?? []).includes(episode.number))
      : undefined;

  function markNext() {
    if (!next || !userId) return;
    const { season, episode } = next;
    const previous = watchedBy.get(season.number) ?? [];
    const list = [...previous, episode.number];
    setWatched(season.number, list);
    startMarking(async () => {
      const id = await persistEpisodes({
        userId,
        seasonItemId: seasonIds.get(season.number) ?? null,
        seriesItemId,
        tmdb: { show: showId, season: season.number },
        added: [episode.number],
        removed: [],
        completesSeason: !seasonsDone.has(season.number) && season.episodes.every((e) => list.includes(e.number)),
      });
      if (!id) return setWatched(season.number, previous);
      setSeasonIds((m) => new Map(m).set(season.number, id));
      router.refresh();
    });
  }
  const rows = Math.max(0, ...rated.map((s) => Math.max(0, ...s.episodes.map((e) => e.number))));
  const openSeason = (n: number) => {
    setSelected(n);
    setTab("episodes");
  };
  const seasonLabel = (s: SeasonView) => (s.number === 0 ? t.series.specials : `${t.series.seasonShort}${s.number}`);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <nav className="-mb-px flex gap-5" role="tablist">
          {(rated.length ? (["ratings", "episodes"] as const) : (["episodes"] as const)).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === tab}
              onClick={() => setTab(key)}
              className={`border-b-2 pb-2 text-xs font-semibold tracking-widest uppercase transition ${
                key === tab ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {key === "ratings" ? t.series.ratingsTitle : t.series.episodes}
            </button>
          ))}
        </nav>
        {tab === "episodes" && (
          <p className="pb-2 text-xs text-muted tabular-nums">
            {userId ? t.series.progress(totalWatched, totalEpisodes) : t.series.episodeCount(totalEpisodes)}
          </p>
        )}
        {tab === "ratings" && (
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 text-xs text-muted">
            {SCALE.map((b) => (
              <li key={b.key} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${b.className}`} />
                {t.series.scale[b.key]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {tab === "ratings" ? (
        <div className="overflow-x-auto pb-1">
          <table className="border-separate border-spacing-1 text-xs tabular-nums">
            <thead>
              <tr>
                <th />
                {rated.map((s) => (
                  <th key={s.number} className="px-1 font-semibold text-muted">
                    <button type="button" onClick={() => openSeason(s.number)} className="hover:text-fg">
                      {t.series.seasonShort}
                      {s.number}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, i) => i + 1).map((n) => (
                <tr key={n}>
                  <th className="pe-1 text-end font-semibold text-muted">
                    {t.series.episodeShort}
                    {n}
                  </th>
                  {rated.map((s) => {
                    const ep = s.episodes.find((e) => e.number === n);
                    if (!ep) return <td key={s.number} />;
                    return (
                      <td key={s.number} className="p-0">
                        <button
                          type="button"
                          onClick={() => openSeason(s.number)}
                          title={`${t.series.seasonShort}${s.number} ${t.series.episodeShort}${n} · ${ep.name}`}
                          className={`block w-11 rounded py-1 text-center font-semibold transition hover:opacity-80 ${
                            ep.rating === null ? "bg-surface-2 text-muted" : band(ep.rating).className
                          }`}
                        >
                          {ep.rating === null ? "–" : ep.rating.toFixed(1)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {next && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <div className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded bg-surface-2 sm:block">
                {next.episode.still && <Image src={next.episode.still} alt="" fill sizes="112px" className="object-cover" />}
              </div>
              <button type="button" onClick={() => setSelected(next.season.number)} className="min-w-0 flex-1 text-start">
                <span className="block text-[11px] font-semibold tracking-widest text-muted uppercase">{t.series.upNext}</span>
                <span className="block truncate text-sm font-semibold">
                  <span className="text-muted tabular-nums">
                    {t.series.seasonShort}
                    {next.season.number} {t.series.episodeShort}
                    {next.episode.number}
                  </span>{" "}
                  · {next.episode.name}
                </span>
                {next.episode.date && <span className="block text-xs text-muted">{next.episode.date}</span>}
              </button>
              <button
                type="button"
                onClick={markNext}
                disabled={marking}
                title={t.movie.watch}
                aria-label={t.movie.watch}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted transition hover:border-ok hover:text-ok disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </button>
            </div>
          )}
          {/* Temporadas: uma pílula para cada, especiais por último */}
          <div className="flex flex-wrap gap-1.5">
            {seasons.map((s) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setSelected(s.number)}
                title={s.name}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  s.number === current.number
                    ? "border-fg bg-fg text-bg"
                    : "border-border text-muted hover:border-fg hover:text-fg"
                }`}
              >
                {seasonLabel(s)}
              </button>
            ))}
          </div>
          {current.episodes.length ? (
            <EpisodeList
              key={current.number}
              embedded
              seasonItemId={seasonIds.get(current.number) ?? null}
              seriesItemId={seriesItemId}
              tmdb={{ show: showId, season: current.number }}
              userId={userId}
              seasonWatched={seasonsDone.has(current.number)}
              initialWatched={current.watched}
              watched={watchedBy.get(current.number) ?? []}
              onWatchedChange={(list) => {
                setWatched(current.number, list);
                if (current.episodes.every((e) => list.includes(e.number)))
                  setSeasonsDone((done) => new Set(done).add(current.number));
              }}
              onSeasonId={(id) => setSeasonIds((m) => new Map(m).set(current.number, id))}
              episodes={current.episodes}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
