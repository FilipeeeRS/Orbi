import Link from "next/link";

export function Logo({ slogan }: { slogan?: string }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3">
      <OrbiMark className="size-10 transition-transform duration-500 group-hover:rotate-[-12deg]" />
      <span className="font-display text-2xl leading-none font-extrabold tracking-tight">orbi</span>
      {slogan && (
        <span className="hidden border-s border-border ps-3 text-xs leading-tight text-muted md:block">{slogan}</span>
      )}
    </Link>
  );
}

// Planeta com anel: a metade de trás do anel passa por trás do planeta.
export function OrbiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <clipPath id="orbi-ring-front">
          <rect x="0" y="20" width="40" height="20" />
        </clipPath>
      </defs>
      <g transform="rotate(-25 20 20)">
        <ellipse cx="20" cy="20" rx="18" ry="7" fill="none" className="stroke-fg" strokeWidth="2.2" opacity="0.55" />
        <circle cx="20" cy="20" r="9" className="fill-accent" />
        <ellipse
          cx="20"
          cy="20"
          rx="18"
          ry="7"
          fill="none"
          className="stroke-fg"
          strokeWidth="2.2"
          clipPath="url(#orbi-ring-front)"
        />
      </g>
    </svg>
  );
}
