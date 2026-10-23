// Ícones dos status, os mesmos em todo o site (selo do pôster, atividade dos amigos):
// ✓ visto (verde), ▶ assistindo/lendo/jogando e o relógio da watchlist.
export type Status = "watched" | "watching" | "watchlist";

export function StatusIcon({ status, className = "size-3.5", label }: { status: Status; className?: string; label?: string }) {
  const color = status === "watched" ? "text-ok" : "text-fg";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${color}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
    >
      {status === "watched" ? (
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="3.2" />
      ) : status === "watching" ? (
        <path d="M8.5 6.5v11l9-5.5z" fill="currentColor" strokeWidth="1.5" />
      ) : (
        <path d="M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" strokeWidth="2.4" />
      )}
    </svg>
  );
}
