"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n";
import { TranslatableText } from "@/components/translatable-text";
import { ContentMenu } from "@/components/content-menu";
import { timeAgo } from "@/components/review-comments";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { addListComment, deleteListComment, setListLike, setListSave, type ListComment } from "@/app/lists/social-actions";

const HEART = "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z";

// À direita do título da lista: ♥ (curtir), marcador (salvar, como no Instagram) e ⋯ (denunciar).
export function ListActions({
  listId,
  ownerId,
  viewerId,
  initialLiked,
  initialLikes,
  initialSaved,
}: {
  listId: string;
  ownerId: string;
  viewerId: string | null;
  initialLiked: boolean;
  initialLikes: number;
  initialSaved: boolean;
}) {
  const { t } = useI18n();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [saved, setSaved] = useState(initialSaved);
  const [, start] = useTransition();
  const likeClass = `flex items-center gap-1.5 text-sm tabular-nums transition ${liked ? "text-like" : "text-muted hover:text-like"}`;
  const heart = (
    <svg viewBox="0 0 24 24" className="size-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d={HEART} />
    </svg>
  );

  function toggle() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    start(async () => {
      const { ok } = await setListLike(listId, next);
      if (!ok) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    });
  }

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    start(async () => {
      const { ok } = await setListSave(listId, next);
      if (!ok) setSaved(!next);
    });
  }

  const flag = (
    <svg viewBox="0 0 24 24" className="size-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
      <path d="M6 3h12v18l-6-5-6 5z" />
    </svg>
  );
  const flagClass = `transition ${saved ? "text-like" : "text-muted hover:text-like"}`;

  return (
    <div className="flex items-center gap-3">
      {viewerId ? (
        <button type="button" onClick={toggle} aria-pressed={liked} title={t.lists.like} className={likeClass}>
          {heart}
          {likes}
        </button>
      ) : (
        <Link href="/login" title={t.lists.like} className={likeClass}>
          {heart}
          {likes}
        </Link>
      )}
      {viewerId ? (
        <button type="button" onClick={toggleSave} aria-pressed={saved} title={saved ? t.lists.savedList : t.lists.saveList} className={flagClass}>
          {flag}
        </button>
      ) : (
        <Link href="/login" title={t.lists.saveList} className={flagClass}>
          {flag}
        </Link>
      )}
      <ContentMenu target="list" targetId={listId} ownerId={ownerId} viewerId={viewerId} size="md" />
    </div>
  );
}

// Comentários da lista (do mais antigo para o mais novo), com o campo para escrever no fim.
export function ListComments({
  listId,
  ownerId,
  viewerId,
  initial,
}: {
  listId: string;
  ownerId: string;
  viewerId: string | null;
  initial: ListComment[];
}) {
  const { t, locale } = useI18n();
  const lang = dictionaries[locale].htmlLang;
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(false);
    start(async () => {
      const { comment } = await addListComment(listId, body);
      if (!comment) return setError(true);
      setBody("");
      setComments((list) => [...list, comment]);
    });
  }

  function remove(c: ListComment) {
    if (!confirm(t.comments.confirmDelete)) return;
    const previous = comments;
    setComments((list) => list.filter((x) => x.id !== c.id));
    start(async () => {
      const { ok } = await deleteListComment(c.id);
      if (!ok) setComments(previous);
    });
  }

  return (
    <section id="comments" className="scroll-mt-24">
      <h2 className="mb-3 border-b border-border pb-2 text-xs font-semibold tracking-widest text-muted uppercase">
        {t.lists.comments} <span className="font-normal tabular-nums">{comments.length}</span>
      </h2>
      {comments.length === 0 && <p className="mb-4 text-sm text-muted">{t.lists.noComments}</p>}
      <ul className="mb-4 space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <Link href={`/u/${c.author?.username}`} className="shrink-0">
              <Avatar profile={c.author} size={32} ring={c.author?.avatar_ring} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <Link href={`/u/${c.author?.username}`} className="font-semibold text-fg hover:text-accent">
                    {c.author?.display_name || c.author?.username}
                  </Link>
                  <span className="text-muted">@{c.author?.username}</span>
                  <time dateTime={c.created_at} title={new Date(c.created_at).toLocaleString(lang)} className="text-muted">
                    · {timeAgo(c.created_at, lang)}
                  </time>
                </p>
                <ContentMenu
                  target="list_comment"
                  targetId={c.id}
                  ownerId={c.user_id}
                  viewerId={viewerId}
                  onDelete={viewerId && (viewerId === c.user_id || viewerId === ownerId) ? () => remove(c) : undefined}
                />
              </div>
              <TranslatableText text={c.body} className="mt-0.5 text-sm break-words whitespace-pre-line" />
            </div>
          </li>
        ))}
      </ul>
      {viewerId ? (
        <form onSubmit={submit} className="space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
              }}
              maxLength={2000}
              rows={1}
              placeholder={t.comments.placeholder}
              className="field-sizing-content max-h-40 min-h-9 w-full resize-none rounded-lg border border-border bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
            <button
              disabled={pending || !body.trim()}
              className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
            >
              {t.comments.send}
            </button>
          </div>
          {error && <p className="text-xs text-danger">{t.common.error}</p>}
        </form>
      ) : (
        <Link href="/login" className="inline-block text-xs text-accent hover:underline">
          {t.comments.signIn}
        </Link>
      )}
    </section>
  );
}
