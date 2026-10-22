"use client";

import { useRouter } from "next/navigation";

// "Marcar tudo como lido": tudo até agora fica cinza e o número do menu zera.
export function MarkAllRead({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `orbi-notifications-seen=${new Date().toISOString()}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        // As que foram marcadas de novo como não lidas também passam a lidas
        document.cookie = "orbi-notif-unread=; path=/; max-age=0; samesite=lax";
        router.refresh();
      }}
      className="text-xs font-semibold text-accent hover:underline"
    >
      {label}
    </button>
  );
}
