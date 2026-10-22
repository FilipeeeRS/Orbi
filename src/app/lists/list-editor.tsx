"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n";
import { deleteList, getListForEdit, saveList, searchMoviesForList, type ListPick } from "./actions";

const MAX_ITEMS = 250;

// Janela de criar/editar lista: nome, descrição e filmes (busca no TMDB, reordenar, remover).
// Sem listId cria uma nova; o "gatilho" é a caixa com + (nova) ou o botão Editar.
export function ListEditor({ listId, username, variant }: { listId?: string; username: string; variant: "card" | "wide" | "button" }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "card" || variant === "wide" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group flex ${variant === "wide" ? "aspect-[20/9]" : "aspect-[2/3]"} w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border text-muted transition hover:border-accent hover:text-accent`}
        >
          <svg viewBox="0 0 24 24" className="size-10 transition group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-sm font-semibold">{t.lists.new}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
        >
          {t.lists.edit}
        </button>
      )}
      {open && <EditorDialog listId={listId} username={username} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditorDialog({ listId, username, onClose }: { listId?: string; username: string; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(!!listId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [picks, setPicks] = useState<ListPick[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ListPick[] | null>(null);
  const [error, setError] = useState(false);
  const [saving, start] = useTransition();
  const searchSeq = useRef(0);

  // Editando: carrega nome, descrição e filmes atuais.
  useEffect(() => {
    if (!listId) return;
    getListForEdit(listId).then((data) => {
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setPicks(data.picks);
      }
      setLoading(false);
    });
  }, [listId]);

  // Esc fecha; a página atrás não rola.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Busca com uma pequena espera enquanto a pessoa digita; só vale a resposta mais recente.
  useEffect(() => {
    const q = query.trim();
    const seq = ++searchSeq.current;
    const timer = setTimeout(
      () => {
        if (q.length < 2) return setResults(null);
        searchMoviesForList(q).then((found) => seq === searchSeq.current && setResults(found));
      },
      q.length < 2 ? 0 : 350,
    );
    return () => clearTimeout(timer);
  }, [query]);

  const keys = new Set(picks.map((p) => p.key));
  const tmdbIds = new Set(picks.map((p) => p.tmdbId).filter(Boolean));
  const isAdded = (p: ListPick) => keys.has(p.key) || (!!p.tmdbId && tmdbIds.has(p.tmdbId));

  function add(p: ListPick) {
    if (isAdded(p) || picks.length >= MAX_ITEMS) return;
    setPicks((list) => [...list, p]);
  }
  // Reordenar arrastando: o filme arrastado vai para a posição de onde for solto.
  const [dragging, setDragging] = useState<number | null>(null);
  function moveTo(from: number, to: number) {
    if (from === to) return;
    setPicks((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function save() {
    setError(false);
    start(async () => {
      const { id } = await saveList({ id: listId, title, description, picks });
      if (!id) return setError(true);
      onClose();
      if (listId) router.refresh();
      else router.push(`/u/${username}/list/${id}`);
    });
  }

  function remove() {
    if (!listId || !confirm(t.lists.confirmDelete)) return;
    setError(false);
    start(async () => {
      const { ok } = await deleteList(listId);
      if (!ok) return setError(true);
      onClose();
      router.push(`/u/${username}/all?tab=lists`);
    });
  }

  const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={listId ? t.lists.edit : t.lists.new}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-lg font-bold">{listId ? t.lists.edit : t.lists.new}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.lists.cancel}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            <div className="h-10 animate-pulse rounded-lg bg-surface-2" />
            <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto p-5 text-sm">
            <label className="block">
              <span className="mb-1 block text-muted">{t.lists.name}</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                autoFocus
                placeholder={t.lists.namePlaceholder}
                className={input}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-muted">{t.lists.description}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={2}
                placeholder={t.lists.descriptionPlaceholder}
                className={input}
              />
            </label>

            {/* Adicionar filmes */}
            <div className="relative">
              <span className="mb-1 block text-muted">{t.lists.addFilms}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.lists.searchPlaceholder}
                className={input}
              />
              {results && (
                <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-bg">
                  {results.length === 0 ? (
                    <li className="px-3 py-3 text-muted">{t.lists.noResults}</li>
                  ) : (
                    results.map((r) => {
                      const added = isAdded(r);
                      return (
                        <li key={r.key}>
                          <button
                            type="button"
                            onClick={() => add(r)}
                            disabled={added}
                            className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-surface-2 disabled:opacity-60"
                          >
                            <Thumb poster={r.poster} />
                            <span className="min-w-0 flex-1 truncate">
                              {r.title} {r.year && <span className="text-muted">{r.year}</span>}
                            </span>
                            <span className={`text-xs ${added ? "text-ok" : "text-accent"}`}>{added ? `✓ ${t.lists.added}` : "+"}</span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>

            {/* Filmes da lista, na ordem */}
            <div>
              <p className="mb-2 text-muted">{t.lists.count(picks.length)}</p>
              {picks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-muted">{t.lists.emptyPicks}</p>
              ) : (
                <ol className="divide-y divide-border rounded-lg border border-border">
                  {picks.map((p, i) => (
                    <li
                      key={p.key}
                      draggable
                      onDragStart={(e) => {
                        setDragging(i);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragging !== null && dragging !== i) {
                          moveTo(dragging, i);
                          setDragging(i);
                        }
                      }}
                      onDragEnd={() => setDragging(null)}
                      className={`flex cursor-grab items-center gap-3 px-3 py-2 active:cursor-grabbing ${dragging === i ? "bg-surface-2 opacity-60" : ""}`}
                    >
                      <span aria-hidden className="text-muted/60 select-none" title={t.lists.drag}>
                        ⠿
                      </span>
                      <span className="w-6 text-end text-xs text-muted tabular-nums">{i + 1}</span>
                      <Thumb poster={p.poster} />
                      <span className="min-w-0 flex-1 truncate">
                        {p.title} {p.year && <span className="text-muted">{p.year}</span>}
                      </span>
                      <IconButton label={t.lists.remove} onClick={() => setPicks((list) => list.filter((x) => x.key !== p.key))} path="M6 6l12 12M18 6 6 18" />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3">
          {/* Apagar fica no canto esquerdo (só ao editar uma lista que já existe) */}
          {listId && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-danger disabled:opacity-40"
            >
              {t.lists.delete}
            </button>
          )}
          <span className="me-auto text-sm text-danger">{error ? t.common.error : null}</span>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
            {t.lists.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !title.trim()}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
          >
            {saving ? t.lists.saving : listId ? t.lists.save : t.lists.create}
          </button>
        </div>
      </div>
    </div>
  );
}

function Thumb({ poster }: { poster: string | null }) {
  return poster ? (
    // eslint-disable-next-line @next/next/no-img-element -- miniatura do pôster (CDN do TMDB/Storage)
    <img src={poster} alt="" loading="lazy" className="h-12 w-8 shrink-0 rounded object-cover" />
  ) : (
    <span className="h-12 w-8 shrink-0 rounded bg-surface-2" />
  );
}

function IconButton({ label, onClick, disabled, path }: { label: string; onClick: () => void; disabled?: boolean; path: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={path} />
      </svg>
    </button>
  );
}
