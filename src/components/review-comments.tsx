"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { useI18n } from "./i18n";
import { TranslatableText } from "./translatable-text";
import { dictionaries } from "@/lib/i18n/dictionaries";
import {
  addReviewComment,
  deleteReviewComment,
  listReviewComments,
  setCommentLike,
  type ReviewComment,
  deleteReview,
} from "@/app/comment-actions";

// Conversa de uma review, estilo Twitter: 💬 com o número abre os comentários embaixo da review.
// Respostas ficam recuadas sob o comentário original (um nível), com "@fulano" no começo.
export function ReviewComments({
  entryId,
  reviewOwnerId,
  viewerId,
  initialCount,
  actions,
}: {
  entryId: string;
  reviewOwnerId: string;
  viewerId: string | null;
  initialCount: number;
  actions?: React.ReactNode; // ao lado do 💬 (ex.: o ♥ da review)
}) {
  const { t } = useI18n();
  const [removing, startRemoving] = useTransition();
  function removeReview() {
    if (!confirm(t.comments.confirmDeleteReview)) return;
    startRemoving(async () => {
      await deleteReview(entryId);
    });
  }
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<ReviewComment[] | null>(null);
  const [count, setCount] = useState(initialCount);
  const [replyTo, setReplyTo] = useState<ReviewComment | null>(null);
  const [, start] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !comments) start(async () => setComments(await listReviewComments(entryId)));
  }

  function added(comment: ReviewComment) {
    setComments((list) => [...(list ?? []), comment]);
    setCount((n) => n + 1);
    setReplyTo(null);
  }

  // Com respostas: vira "Comentário apagado" e as respostas ficam. Sem respostas: some.
  // Um comentário já apagado que fica sem respostas também some (mesma regra do banco).
  function remove(comment: ReviewComment) {
    if (!confirm(t.comments.confirmDelete)) return;
    const previous = comments ?? [];
    const hasReplies = previous.some((c) => c.parent_id === comment.id);
    const next = hasReplies
      ? previous.map((c) => (c.id === comment.id ? { ...c, body: "", deleted_at: new Date().toISOString() } : c))
      : previous.filter(
          (c) =>
            c.id !== comment.id &&
            !(c.id === comment.parent_id && c.deleted_at && !previous.some((r) => r.parent_id === c.id && r.id !== comment.id)),
        );
    setComments(next);
    setCount((n) => n - 1);
    start(async () => {
      const { mode } = await deleteReviewComment(comment.id);
      if (!mode) {
        setComments(previous);
        setCount((n) => n + 1);
      }
    });
  }

  // Respostas a respostas ficam no mesmo fio do comentário de origem.
  const roots = (comments ?? []).filter((c) => !c.parent_id);
  const repliesOf = (id: string) => (comments ?? []).filter((c) => c.parent_id === id);
  const canDelete = (c: ReviewComment) => !!viewerId && (c.user_id === viewerId || reviewOwnerId === viewerId);

  return (
    <div className="mt-2">
      {/* gap pequeno: o ♥ da review já tem respiro próprio (px-2) */}
      <div className="flex items-center gap-2">
        {/* Ordem: like (actions), comentários, apagar */}
        {actions}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={t.comments.comment}
          title={t.comments.comment}
          className={`flex items-center gap-1.5 text-xs transition ${open ? "text-fg" : "text-muted hover:text-fg"}`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
          </svg>
          {/* Só o ícone quando não há comentários; com comentários, o número */}
          {count > 0 && <span className="tabular-nums">{count}</span>}
        </button>
        {/* Dono da review: apagar a review (e a conversa inteira dela) */}
        {viewerId && viewerId === reviewOwnerId && (
          <button
            type="button"
            onClick={removeReview}
            disabled={removing}
            aria-label={t.comments.deleteReview}
            title={t.comments.deleteReview}
            className="text-muted transition hover:text-danger disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-4 border-s-2 border-border ps-4">
          {comments === null ? (
            <div className="h-10 animate-pulse rounded-lg bg-surface-2" />
          ) : roots.length === 0 ? null : (
            <ul className="space-y-4">
              {roots.map((c) => (
                <li key={c.id} className="space-y-3">
                  <CommentRow
                    comment={c}
                    viewerId={viewerId}
                    onReply={viewerId ? () => setReplyTo(c) : undefined}
                    onDelete={canDelete(c) ? () => remove(c) : undefined}
                  />
                  {repliesOf(c.id).length > 0 && (
                    <ul className="space-y-3 ps-9">
                      {repliesOf(c.id).map((r) => (
                        <li key={r.id}>
                          <CommentRow
                            comment={r}
                            viewerId={viewerId}
                            onReply={viewerId ? () => setReplyTo(r) : undefined}
                            onDelete={canDelete(r) ? () => remove(r) : undefined}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          {viewerId ? (
            <CommentForm
              key={replyTo?.id ?? "new"}
              entryId={entryId}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onAdded={added}
            />
          ) : (
            <Link href="/login" className="inline-block text-xs text-accent hover:underline">
              {t.comments.signIn}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment: c,
  viewerId,
  onReply,
  onDelete,
}: {
  comment: ReviewComment;
  viewerId: string | null;
  onReply?: () => void;
  onDelete?: () => void;
}) {
  const { t, locale } = useI18n();
  const name = c.author?.display_name || c.author?.username;

  // Apagado (mas com respostas): sem autor nem texto, só o aviso
  if (c.deleted_at) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="size-7 shrink-0 rounded-full border border-dashed border-border" aria-hidden />
        <p className="text-sm text-muted italic">{t.comments.deleted}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <Link href={`/u/${c.author?.username}`} className="shrink-0">
        <Avatar profile={c.author} size={28} ring={c.author?.avatar_ring} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <Link href={`/u/${c.author?.username}`} className="font-semibold text-fg hover:text-accent">
            {name}
          </Link>
          <span className="text-muted">@{c.author?.username}</span>
          <time dateTime={c.created_at} title={new Date(c.created_at).toLocaleString(dictionaries[locale].htmlLang)} className="text-muted">
            · {timeAgo(c.created_at, dictionaries[locale].htmlLang)}
          </time>
        </p>
        {/* Responder · Traduzir · Apagar na mesma linha */}
        <TranslatableText
          text={c.body}
          className="mt-0.5 text-sm break-words whitespace-pre-line"
          before={
            onReply && (
              <button type="button" onClick={onReply} className="text-muted hover:text-fg">
                {t.comments.reply}
              </button>
            )
          }
        >
          {onDelete && (
            <button type="button" onClick={onDelete} className="text-muted hover:text-danger">
              {t.comments.delete}
            </button>
          )}
          <CommentLike commentId={c.id} viewerId={viewerId} initialLiked={c.liked} initialCount={c.likes} />
        </TranslatableText>
      </div>
    </div>
  );
}

// ♥ com a contagem; muda na hora e volta atrás se o servidor recusar. Sem login, leva para entrar.
function CommentLike({
  commentId,
  viewerId,
  initialLiked,
  initialCount,
}: {
  commentId: string;
  viewerId: string | null;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { t } = useI18n();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();
  const heart = (
    <svg viewBox="0 0 24 24" className="size-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  );
  const className = `flex items-center gap-1 tabular-nums transition ${liked ? "text-like" : "text-muted hover:text-like"}`;

  if (!viewerId) {
    return (
      <Link href="/login" className={className} title={t.movie.like}>
        {heart}
        {count > 0 && count}
      </Link>
    );
  }

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((n) => n + (next ? 1 : -1));
    start(async () => {
      const { ok } = await setCommentLike(commentId, next);
      if (!ok) {
        setLiked(!next);
        setCount((n) => n + (next ? -1 : 1));
      }
    });
  }

  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={liked} title={t.movie.like} className={className}>
      {heart}
      {count > 0 && count}
    </button>
  );
}

function CommentForm({
  entryId,
  replyTo,
  onCancelReply,
  onAdded,
}: {
  entryId: string;
  replyTo: ReviewComment | null;
  onCancelReply: () => void;
  onAdded: (comment: ReviewComment) => void;
}) {
  const { t } = useI18n();
  // O campo começa vazio; "Respondendo a @fulano" acima dele já diz para quem é a resposta.
  const [body, setBody] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  // Só "@fulano" (sem mais nada) conta como vazio.
  const empty = isEmptyComment(body);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (empty) return;
    setError(false);
    // Resposta a uma resposta entra no fio do comentário de origem.
    const parentId = replyTo ? (replyTo.parent_id ?? replyTo.id) : null;
    start(async () => {
      const { comment } = await addReviewComment(entryId, body, parentId);
      if (!comment) return setError(true);
      setBody("");
      onAdded(comment);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {replyTo && (
        <p className="flex items-center gap-2 text-xs text-muted">
          {t.comments.replyingTo(replyTo.author?.username ?? "")}
          <button type="button" onClick={onCancelReply} className="hover:text-fg" aria-label={t.comments.cancel}>
            ×
          </button>
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          autoFocus={!!replyTo}
          maxLength={2000}
          rows={1}
          placeholder={t.comments.placeholder}
          className="field-sizing-content max-h-40 min-h-9 w-full resize-none rounded-lg border border-border bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button
          disabled={pending || empty}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
        >
          {t.comments.send}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{t.common.error}</p>}
    </form>
  );
}

// Vazio = nada além de menções ("@fulano" sozinho não vale).
function isEmptyComment(body: string) {
  return !body.replace(/@[a-z0-9_]+/gi, "").trim();
}

// "agora", "há 5 min", "há 3 h", "há 2 dias"... no idioma da pessoa
function timeAgo(iso: string, lang: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  return rtf.format(0, "second");
}
