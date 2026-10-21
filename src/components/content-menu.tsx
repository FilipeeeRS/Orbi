"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "./i18n";
import { reportContent, type ReportReason, type ReportTarget } from "@/app/report-actions";

const REASONS: ReportReason[] = ["spam", "offensive", "harassment", "spoiler", "other"];

// "⋯" de uma review, comentário ou lista: Apagar (quando pode) e Denunciar (conteúdo dos outros).
// Sem login, Denunciar leva para entrar.
export function ContentMenu({
  target,
  targetId,
  ownerId,
  viewerId,
  onDelete,
  deleteLabel,
  size = "sm",
  align = "end",
}: {
  target: ReportTarget;
  targetId: string;
  ownerId: string;
  viewerId: string | null;
  onDelete?: () => void;
  deleteLabel?: string;
  size?: "sm" | "md";
  align?: "start" | "end"; // lado em que o menu abre (start quando o ⋯ fica à esquerda da tela)
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canReport = viewerId !== ownerId;

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!onDelete && !canReport) return null;
  const item = "block w-full px-3 py-1.5 text-start transition hover:bg-surface-2";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t.report.more}
        title={t.report.more}
        className={`grid place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg ${size === "md" ? "size-9" : "size-6"}`}
      >
        <svg viewBox="0 0 24 24" className={size === "md" ? "size-5" : "size-4"} fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <ul className={`absolute ${align === "start" ? "start-0" : "end-0"} top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 text-sm shadow-xl`}>
          {onDelete && (
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className={`${item} text-danger`}
              >
                {deleteLabel ?? t.comments.delete}
              </button>
            </li>
          )}
          {canReport && (
            <li>
              {viewerId ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setReporting(true);
                  }}
                  className={item}
                >
                  {t.report.report}
                </button>
              ) : (
                <Link href="/login" className={item}>
                  {t.report.report}
                </Link>
              )}
            </li>
          )}
        </ul>
      )}
      {reporting && <ReportDialog target={target} targetId={targetId} onClose={() => setReporting(false)} />}
    </div>
  );
}

// Janela da denúncia: o motivo, um texto opcional e enviar.
function ReportDialog({ target, targetId, onClose }: { target: ReportTarget; targetId: string; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [result, setResult] = useState<"sent" | "already" | "error" | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    start(async () => {
      const r = await reportContent(target, targetId, reason, details);
      setResult(!r.ok ? "error" : r.already ? "already" : "sent");
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/60"
    >
      {result === "sent" || result === "already" ? (
        <div className="space-y-4 p-5">
          <p className="font-semibold">{result === "sent" ? t.report.thanks : t.report.already}</p>
          <p className="text-sm text-muted">{t.report.thanksHint}</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90"
            >
              {t.report.close}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold">{t.report.title}</h2>
          <fieldset className="space-y-1">
            <legend className="mb-2 text-sm text-muted">{t.report.why}</legend>
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--accent)]" />
                {t.report.reasons[r]}
              </label>
            ))}
          </fieldset>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t.report.details}
            className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {result === "error" && <p className="text-xs text-danger">{t.common.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className="rounded-lg px-4 py-1.5 text-sm text-muted hover:text-fg">
              {t.report.cancel}
            </button>
            <button
              disabled={!reason || pending}
              className="rounded-lg bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {t.report.send}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
