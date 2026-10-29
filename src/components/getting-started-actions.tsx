"use client";

import { useRouter } from "next/navigation";
import { useQuickLog } from "./quick-log";

// "Começar" do passo "Dê nota a 5 obras": abre a janela de registrar.
export function StartQuickLog({ label }: { label: string }) {
  const { open } = useQuickLog();
  return (
    <button type="button" onClick={open} className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg hover:opacity-90">
      {label}
    </button>
  );
}

// "Esconder" os primeiros passos (fica guardado neste navegador).
export function HideGettingStarted({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `orbi-getting-started-hidden=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        router.refresh();
      }}
      className="text-xs text-muted hover:text-fg"
    >
      {label}
    </button>
  );
}
