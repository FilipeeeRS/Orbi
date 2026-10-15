import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="16" r="6" className="fill-accent" />
        <ellipse cx="16" cy="16" rx="14" ry="6" transform="rotate(-25 16 16)" fill="none" className="stroke-fg" strokeWidth="2" opacity="0.8" />
      </svg>
      orbi
    </Link>
  );
}
