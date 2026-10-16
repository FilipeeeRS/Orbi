"use client";

import { useState } from "react";

// Baixa o cartão do perfil (gerado em /u/<usuário>/card) como PNG.
export function ExportImageButton({ username, label }: { username: string; label: string }) {
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const res = await fetch(`/u/${encodeURIComponent(username)}/card`);
      if (!res.ok) return;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `orbi-${username}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={pending}
      title={label}
      aria-label={label}
      className="grid size-7 place-items-center rounded-md bg-surface-2 text-muted transition hover:text-fg disabled:opacity-60"
    >
      {pending ? (
        <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M21 12a9 9 0 1 1-6.2-8.6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4v11m0 0-4-4m4 4 4-4" />
          <path d="M5 19h14" />
        </svg>
      )}
    </button>
  );
}
