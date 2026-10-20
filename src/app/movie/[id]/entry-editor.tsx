"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";
import { StarIcon } from "@/components/stars";
import type { Entry } from "@/lib/types";
import {
  ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  attachmentKind,
  formatBytes,
  type Attachment,
} from "@/lib/attachments";
import { AttachmentIcon } from "@/components/review-attachments";

type Draft = Pick<
  Entry,
  "status" | "rating" | "liked" | "review" | "watched_on" | "attachments"
>;

const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD no fuso local

// Grava direto no Supabase (RLS garante que só o dono escreve). O mesmo fluxo serve para um app mobile.
export function EntryEditor({
  itemId,
  userId,
  initial,
  series = false,
  progress = false,
  verb,
}: {
  itemId: string;
  userId: string;
  initial: Entry | null;
  series?: boolean; // séries e temporadas ganham o status "Assistindo"
  // Série: no "Assistindo", temporada/episódio onde parou. "episode": só o episódio (anime);
  // "chapter": só o capítulo (mangá, que também troca Assistir/Assistindo por Ler/Lendo).
  progress?: boolean | "episode" | "chapter";
  verb?: "play"; // jogo: "Jogar / Jogado / Jogando"
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [entry, setEntry] = useState<Draft | null>(initial);
  const [review, setReview] = useState(initial?.review ?? "");
  const [watchedOn, setWatchedOn] = useState(initial?.watched_on ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Sempre abre recolhido (só ações e estrelas); a seta ou uma mudança de status mostra review, data e salvar.
  const [expanded, setExpanded] = useState(false);
  // O Next mantém a página escondida (Activity) ao sair e a mostra de novo ao voltar, com o estado antigo.
  // Ao esconder, recolhe de novo, para voltar sempre fechado.
  useLayoutEffect(() => {
    return () => setExpanded(false);
  }, []);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  const watched = entry?.status === "watched";
  const onWatchlist = entry?.status === "watchlist";
  const watching = entry?.status === "watching";
  const reading = progress === "chapter"; // mangá e livro: "Ler / Lido / Lendo" e "Parei no capítulo"
  const playing = verb === "play"; // jogo: "Jogar / Jogado / Jogando"
  const [stoppedAt, setStoppedAt] = useState({
    season: initial?.current_season ?? null,
    episode: initial?.current_episode ?? null,
  });

  // Dados novos do servidor (ex.: episódios marcados na lista mudaram o status ou o "Parei em"):
  // atualiza status e "Parei em" sem remontar o editor (que fecharia a caixa aberta).
  const [syncedAt, setSyncedAt] = useState(initial?.updated_at);
  if (initial?.updated_at !== syncedAt) {
    setSyncedAt(initial?.updated_at);
    setEntry(initial);
    setStoppedAt({ season: initial?.current_season ?? null, episode: initial?.current_episode ?? null });
  }

  // "Parei em": salva só essas duas colunas, sem mexer no resto da entrada.
  function saveStoppedAt(field: "season" | "episode", raw: string) {
    const value = raw === "" ? null : Math.max(0, Math.min(999, Math.floor(Number(raw)) || 0));
    if (value === stoppedAt[field]) return;
    const next = { ...stoppedAt, [field]: value };
    setStoppedAt(next);
    start(async () => {
      const { error } = await createClient()
        .from("entries")
        .update({ current_season: next.season, current_episode: next.episode })
        .eq("user_id", userId)
        .eq("item_id", itemId);
      if (error) setError(true);
    });
  }

  function persist(next: Draft | null, previous: Draft | null, onSaved?: () => void) {
    // Mudou o status (assistido, assistindo, watchlist; like e nota também marcam assistido): abre o editor.
    if (next && next.status !== previous?.status) setExpanded(true);
    setEntry(next);
    setError(false);
    start(async () => {
      const supabase = createClient();
      // Anexos só vão quando existem (ou acabaram de ser removidos): assim nota, visto e watchlist
      // continuam funcionando mesmo onde a coluna de anexos ainda não foi criada.
      const sendAttachments = !!(next?.attachments?.length || previous?.attachments?.length);
      const { attachments, ...withoutAttachments } = next ?? ({} as Draft);
      const payload = sendAttachments ? { ...withoutAttachments, attachments } : withoutAttachments;
      const { error } = next
        ? await supabase
            .from("entries")
            .upsert(
              { user_id: userId, item_id: itemId, ...payload },
              { onConflict: "user_id,item_id" },
            )
        : await supabase
            .from("entries")
            .delete()
            .eq("user_id", userId)
            .eq("item_id", itemId);
      if (error) {
        setEntry(previous);
        setError(true);
        return;
      }
      onSaved?.();
      router.refresh();
    });
  }

  // Nota, like e review marcam como assistido, como no Letterboxd.
  function asWatched(patch: Partial<Draft>): Draft {
    const base: Draft =
      entry?.status === "watched"
        ? entry
        : {
            status: "watched",
            rating: null,
            liked: false,
            review: null,
            watched_on: watchedOn || today(),
            attachments: [],
          };
    return { ...base, ...patch };
  }

  function toggleWatched() {
    if (!watched) {
      const next = asWatched({});
      setWatchedOn(next.watched_on ?? "");
      return persist(next, entry);
    }
    if (
      (entry?.rating || entry?.liked || entry?.review != null) &&
      !confirm(t.movie.confirmRemove)
    )
      return;
    setReview("");
    setWatchedOn("");
    setAttachments([]);
    persist(null, entry);
  }

  function toggleWatching() {
    persist(
      watching
        ? null
        : { status: "watching", rating: null, liked: false, review: null, watched_on: null, attachments: [] },
      entry,
    );
  }

  function toggleWatchlist() {
    persist(
      onWatchlist
        ? null
        : {
            status: "watchlist",
            rating: null,
            liked: false,
            review: null,
            watched_on: null,
            attachments: [],
          },
      entry,
    );
  }

  function rate(value: number) {
    const next = asWatched({ rating: entry?.rating === value ? null : value });
    setWatchedOn(next.watched_on ?? "");
    persist(next, entry);
  }

  const reviewValue = review.trim() || (attachments.length ? "" : null);

  function saveDetails() {
    const next = asWatched({
      // Só anexos, sem texto, também é review: texto vazio ("") a mantém nas listas de reviews.
      review: reviewValue,
      watched_on: watchedOn || null,
      attachments,
    });
    // Salvou: recolhe o editor (igual a clicar na seta); se der erro, ele fica aberto mostrando o aviso.
    persist(next, entry, () => setExpanded(false));
  }

  const shown = hover ?? entry?.rating ?? 0;
  const dirty =
    reviewValue !== (entry?.review ?? null) ||
    (watchedOn || null) !== (entry?.watched_on ?? null) ||
    JSON.stringify(attachments) !== JSON.stringify(entry?.attachments ?? []);

  // Anexos vão para o Storage assim que escolhidos; entram na review ao salvar.
  async function attach(files: FileList | null) {
    if (!files?.length) return;
    setAttachError(null);
    const room = MAX_ATTACHMENTS - attachments.length;
    const list = [...files].slice(0, room);
    if (files.length > room) setAttachError(t.movie.attachLimit(MAX_ATTACHMENTS));
    const bad = list.find((file) => !ATTACHMENT_TYPES.includes(file.type));
    if (bad) return setAttachError(t.movie.attachType);
    if (list.some((file) => file.size > MAX_ATTACHMENT_BYTES)) return setAttachError(t.movie.attachTooBig);

    setUploading(true);
    const supabase = createClient();
    const added: Attachment[] = [];
    for (const file of list) {
      const safe = file.name.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
      const path = `${userId}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("review-files").upload(path, file, { contentType: file.type });
      if (error) {
        setAttachError(error.message);
        break;
      }
      const url = supabase.storage.from("review-files").getPublicUrl(path).data.publicUrl;
      added.push({ url, name: file.name, type: file.type, size: file.size });
    }
    setAttachments((current) => [...current, ...added].slice(0, MAX_ATTACHMENTS));
    setUploading(false);
  }

  // "Parei em Temporada [ ] Episódio [ ]" (série em Assistindo). Salva ao sair do campo ou com Enter.
  const stoppedAtFields = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <span className="text-muted">{t.series.stoppedAt}</span>
      {(progress === "episode" || reading ? (["episode"] as const) : (["season", "episode"] as const)).map((field) => (
        <label key={field} className="flex items-center gap-1.5">
          <span className="text-muted">
            {field === "season" ? t.series.seasonLabel : reading ? t.manga.chapter : t.series.episodeLabel}
          </span>
          <input
            key={stoppedAt[field] ?? ""}
            type="number"
            min={0}
            max={999}
            inputMode="numeric"
            defaultValue={stoppedAt[field] ?? ""}
            onBlur={(e) => saveStoppedAt(field, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-14 rounded-lg border border-border bg-bg px-2 py-1.5 text-center tabular-nums outline-none focus:border-accent"
          />
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface/80 p-4">
      {/* Linha única: ações à esquerda, estrelas à direita (clicar na nota atual limpa) */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            title={t.movie.review}
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <Toggle
            on={watched}
            onClick={toggleWatched}
            disabled={pending}
            tone="ok"
            icon={ICONS.check}
            removeLabel={t.movie.removeShort}
          >
            {playing
              ? watched
                ? t.game.played
                : t.game.play
              : reading
                ? watched
                  ? t.manga.readDone
                  : t.manga.read
                : watched
                  ? t.movie.watched
                  : t.movie.watch}
          </Toggle>
          {series && !watched && (
            <Toggle
              on={watching}
              onClick={toggleWatching}
              disabled={pending}
              tone="plain"
              icon={ICONS.play}
              removeLabel={t.movie.removeShort}
            >
              {playing ? t.game.playing : reading ? t.manga.reading : t.movies.tabs.watching}
            </Toggle>
          )}
          <Toggle
            on={!!entry?.liked}
            onClick={() => persist(asWatched({ liked: !entry?.liked }), entry)}
            disabled={pending}
            tone="like"
            icon={entry?.liked ? ICONS.heartFilled : ICONS.heart}
            removeLabel={t.movie.removeShort}
          >
            {entry?.liked ? t.movie.liked : t.movie.like}
          </Toggle>
          {!watched && (
            <Toggle
              on={onWatchlist}
              onClick={toggleWatchlist}
              disabled={pending}
              tone="plain"
              icon={ICONS.clock}
              removeLabel={t.movie.removeShort}
            >
              {t.movies.tabs.watchlist}
            </Toggle>
          )}
        </div>

        <div
          className="flex items-center gap-2"
          title={entry?.rating ? t.movie.clearRating : t.movie.rating}
        >
          <div
            className="flex"
            onMouseLeave={() => setHover(null)}
            role="radiogroup"
            aria-label={t.movie.rating}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="relative size-7">
                <StarIcon
                  fill={
                    shown >= star * 2 ? 1 : shown === star * 2 - 1 ? 0.5 : 0
                  }
                />
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
          <span className="w-6 text-sm text-muted tabular-nums">
            {shown ? (shown / 2).toLocaleString() : ""}
          </span>
        </div>
      </div>

      {expanded && (
        <>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              {t.movie.review}
            </span>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={20000}
              rows={3}
              placeholder={t.movie.reviewPlaceholder}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          {/* Anexos já escolhidos (o botão de anexar fica ao lado da data) */}
          {attachments.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <li key={a.url} className="flex items-center gap-2 rounded-lg border border-border bg-bg py-1 ps-1 pe-2 text-xs">
                    {attachmentKind(a.type) === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura do anexo no Storage
                      <img src={a.url} alt="" className="size-8 rounded object-cover" />
                    ) : (
                      <AttachmentIcon type={a.type} className="size-8" />
                    )}
                    <span className="max-w-40 truncate" title={a.name}>
                      {a.name}
                    </span>
                    <span className="text-muted">{formatBytes(a.size)}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((current) => current.filter((_, j) => j !== i))}
                      aria-label={t.movie.attachRemove}
                      title={t.movie.attachRemove}
                      className="grid size-5 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
                    >
                      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3">
            {/* Em Assistindo a data não vale (ainda não terminou): no lugar dela, onde parou */}
            {progress && watching ? (
              stoppedAtFields
            ) : (
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
            )}
            {/* Anexar (imagens, GIFs, PDF, Word e vídeos curtos) ao lado da data; some ao chegar no limite */}
            {attachments.length < MAX_ATTACHMENTS && (
              <label
                title={t.movie.attachHint}
                className={`me-auto flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted transition hover:border-muted hover:text-fg ${
                  uploading ? "pointer-events-none animate-pulse" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15.6 7" />
                </svg>
                {uploading ? t.movie.attaching : t.movie.attach}
                <input
                  type="file"
                  multiple
                  accept={ATTACHMENT_TYPES.join(",")}
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    attach(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <div className="flex items-center gap-3">
              {(error || attachError) && (
                <span className="text-sm text-danger">{attachError ?? t.common.error}</span>
              )}
              <button
                type="button"
                onClick={saveDetails}
                disabled={pending || uploading || !dirty}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
              >
                {t.movie.save}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Mesmos ícones usados nos números do filme e nos atalhos dos pôsteres.
const ICONS = {
  play: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8.5v7l5.5-3.5z" fill="currentColor" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
    </svg>
  ),
  heart: (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  ),
  heartFilled: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  ),
};

// Quando está marcado, passar o mouse troca o texto por "Remover".
function Toggle({
  on,
  tone,
  icon,
  removeLabel,
  children,
  ...props
}: {
  on: boolean;
  tone: "ok" | "plain" | "like";
  icon: React.ReactNode;
  removeLabel: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const active = {
    ok: "border-ok text-ok",
    plain: "border-fg text-fg",
    like: "border-like text-like",
  }[tone];
  return (
    <button
      type="button"
      {...props}
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition disabled:opacity-60 ${
        on ? `${active} bg-surface-2` : "border-border text-muted hover:text-fg"
      }`}
    >
      {icon}
      <span className={on ? "group-hover:hidden" : ""}>{children}</span>
      {on && <span className="hidden group-hover:inline">{removeLabel}</span>}
    </button>
  );
}
