import type { FolderKind } from "@/lib/types";

const PATHS: Record<FolderKind, React.ReactNode> = {
  all: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  movie: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  series: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M8 2l4 4 4-4" />
    </>
  ),
  // Portal torii
  anime: (
    <>
      <path d="M2.5 5.5c3 .8 6 1.2 9.5 1.2s6.5-.4 9.5-1.2" />
      <path d="M4.5 10h15M7 6.6V21M17 6.6V21M12 6.7V10" />
    </>
  ),
  // Página de mangá com quadros
  manga: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M4 10.5h16M13 10.5V21M10 3v7.5" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  // Controle de videogame (cruz à esquerda, botões à direita)
  game: (
    <>
      <path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4A4 4 0 0 0 17.3 5z" />
      <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>
  ),
};

export function FolderIcon({ kind, className = "size-5" }: { kind: FolderKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[kind]}
    </svg>
  );
}
