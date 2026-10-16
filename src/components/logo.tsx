import Link from "next/link";
import { OrbitSync } from "./orbit-sync";

export function Logo({ slogan }: { slogan?: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3">
      <OrbiMark className="size-10 text-fg" />
      <span className="font-logo text-2xl leading-none font-extrabold tracking-tight">orbi</span>
      {slogan && (
        <span className="hidden text-xs leading-tight text-muted md:block">{slogan}</span>
      )}
    </Link>
  );
}

// Metade da frente do anel, que passa na frente do planeta.
const RING_FRONT = "M3 20a17 6 0 0 0 34 0";

// "Tilted orbit": planeta liso, anel inclinado e uma lua que percorre o anel.
// Usa a cor do texto (branco nos temas escuros, preto nos claros); o contorno na cor do fundo
// separa o anel e a lua do planeta.
// A lua é animada com transform em CSS (.orbi-moon-x/.orbi-moon-y no globals.css), que roda fora da
// thread principal: não trava enquanto a página carrega, ao contrário do animateMotion do SVG.
// OrbitSync põe todas as logos no mesmo relógio, então elas giram juntas.
export function OrbiMark({ className, orbitSeconds = 7 }: { className?: string; orbitSeconds?: number }) {
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 ${className ?? ""}`}
      style={{ "--orbit": `${orbitSeconds}s` } as React.CSSProperties}
    >
      <svg viewBox="0 0 40 40" className="size-full">
        <g transform="rotate(-25 20 20)">
          <ellipse cx="20" cy="20" rx="17" ry="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
          <circle cx="20" cy="20" r="8.5" fill="currentColor" />
          <path d={RING_FRONT} fill="none" stroke="var(--bg)" strokeWidth="5.5" />
          <path d={RING_FRONT} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      {/* Lua: mesmo giro de -25° do anel; x e y oscilam em senoide e juntos desenham a elipse */}
      <span className="absolute inset-0 -rotate-25">
        <span className="orbi-moon-x absolute inset-0">
          <span className="orbi-moon-y absolute inset-0">
            <span className="absolute top-1/2 left-1/2 size-[21%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg" />
            <span className="absolute top-1/2 left-1/2 size-[12.5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
          </span>
        </span>
      </span>
      <OrbitSync />
    </span>
  );
}
