import Link from "next/link";

export function Logo({ slogan }: { slogan?: string }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3">
      <OrbiMark className="size-10 transition-transform duration-500 group-hover:rotate-[-12deg]" />
      <span className="font-logo text-2xl leading-none font-extrabold tracking-tight">orbi</span>
      {slogan && (
        <span className="hidden border-s border-border ps-3 text-xs leading-tight text-muted md:block">{slogan}</span>
      )}
    </Link>
  );
}

// Planeta gasoso vermelho (tipo Júpiter) com faixas; a metade de trás do anel passa por trás dele.
export function OrbiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <radialGradient id="orbi-planet" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff8a8f" />
          <stop offset="45%" stopColor="#ff3b52" />
          <stop offset="100%" stopColor="#7a0c24" />
        </radialGradient>
        <clipPath id="orbi-planet-clip">
          <circle cx="20" cy="20" r="9.5" />
        </clipPath>
        <clipPath id="orbi-ring-front">
          <rect x="0" y="20" width="40" height="20" />
        </clipPath>
      </defs>
      <g transform="rotate(-25 20 20)">
        <ellipse cx="20" cy="20" rx="18" ry="6.5" fill="none" className="stroke-fg" strokeWidth="2" opacity="0.45" />
        <circle cx="20" cy="20" r="9.5" fill="url(#orbi-planet)" />
        <g clipPath="url(#orbi-planet-clip)" fill="none" strokeLinecap="round">
          <path d="M9 16.5c4 1.2 8 1.2 13 .3s7-.6 9 .2" stroke="#ffd2d4" strokeOpacity="0.35" strokeWidth="1.4" />
          <path d="M9 21c5 1 9 .8 14-.2s6.5-.4 8 .3" stroke="#4a0716" strokeOpacity="0.45" strokeWidth="2" />
          <path d="M10 25c4 .8 8 .7 12 0" stroke="#ffd2d4" strokeOpacity="0.25" strokeWidth="1.2" />
        </g>
        <ellipse
          cx="20"
          cy="20"
          rx="18"
          ry="6.5"
          fill="none"
          className="stroke-fg"
          strokeWidth="2"
          clipPath="url(#orbi-ring-front)"
        />
      </g>
    </svg>
  );
}
