"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n";
import { FolderIcon } from "./folder-icon";
import { MEDIA_KINDS } from "@/lib/types";

export const WELCOME_COOKIE = "orbi-welcome-seen";

// Boas-vindas no primeiro acesso: o que é o Orbi (as pastas), como funciona o registro e por onde começar
// (perfil, pessoas e Letterboxd). Nada é obrigatório; fechar guarda que a pessoa já viu.
export function WelcomeDialog() {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const total = 3;

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function seen() {
    document.cookie = `${WELCOME_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  const steps = [
    {
      title: t.onboarding.title,
      body: (
        <>
          <p className="text-muted">{t.onboarding.intro}</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MEDIA_KINDS.map((kind) => (
              <li key={kind} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium">
                <FolderIcon kind={kind} className="size-4 shrink-0 text-accent" />
                <span className="min-w-0 truncate">{t.folders[kind]}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      title: t.onboarding.howTitle,
      body: (
        <ul className="space-y-3">
          {t.onboarding.how.map((line, i) => (
            <li key={line} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-muted">{i + 1}</span>
              <span className="pt-0.5">{line}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: t.onboarding.startTitle,
      body: (
        <ul className="space-y-2">
          {[
            { href: "/settings", title: t.onboarding.profile, hint: t.onboarding.profileHint },
            { href: "/search?type=people", title: t.onboarding.follow, hint: t.onboarding.followHint },
            { href: "/import", title: t.onboarding.import, hint: t.onboarding.importHint },
          ].map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                onClick={() => ref.current?.close()}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-fg"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{a.title}</span>
                  <span className="block text-xs text-muted">{a.hint}</span>
                </span>
                <span aria-hidden className="text-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ),
    },
  ];
  const current = steps[step];

  return (
    <dialog
      ref={ref}
      onClose={seen}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={current.title}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-lg font-bold">{current.title}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={t.report.close}
          className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="space-y-4 p-5 text-sm">{current.body}</div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <span className="text-xs text-muted">{t.onboarding.step(step + 1, total)}</span>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
              {t.common.back}
            </button>
          )}
          <button
            type="button"
            onClick={() => (step < total - 1 ? setStep(step + 1) : ref.current?.close())}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            {step < total - 1 ? t.onboarding.next : t.onboarding.done}
          </button>
        </div>
      </div>
    </dialog>
  );
}
