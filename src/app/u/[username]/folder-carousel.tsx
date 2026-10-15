"use client";

import { Children, useEffect, useRef, useState } from "react";

// Linha de pastas paginada: mostra um grupo por vez (5 no desktop, 3 no tablet, 2 no celular)
// e as setas trocam de grupo inteiro, com rolagem suave.
export function FolderCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const count = Children.count(children);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(count / perPage));
  // Espaços vazios no fim para a última página também ter um grupo "cheio" e não repetir pastas.
  const fillers = pages * perPage - count;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setPerPage(Math.max(1, Math.round((el.clientWidth + gap) / (first.offsetWidth + gap))));
    };
    const onScroll = () => {
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setPage(Math.round(Math.abs(el.scrollLeft) / (el.clientWidth + gap)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  const goTo = (next: number) => {
    const el = ref.current;
    if (!el) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const rtl = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: rtl * next * (el.clientWidth + gap), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-3 overflow-x-hidden [&>*]:w-[calc((100%-0.75rem)/2)] [&>*]:shrink-0 sm:[&>*]:w-[calc((100%-1.5rem)/3)] lg:[&>*]:w-[calc((100%-3rem)/5)]"
      >
        {children}
        {Array.from({ length: fillers }, (_, i) => (
          <div key={`filler-${i}`} aria-hidden className="invisible" />
        ))}
      </div>
      {page > 0 && <Arrow side="start" onClick={() => goTo(page - 1)} />}
      {page < pages - 1 && <Arrow side="end" onClick={() => goTo(page + 1)} />}
    </div>
  );
}

function Arrow({ side, onClick }: { side: "start" | "end"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "end" ? "→" : "←"}
      // Fica fora da linha de pastas para não cobrir o texto dos cartões
      className={`absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-fg shadow-xl transition hover:border-accent hover:text-accent ${
        side === "end" ? "-end-4 xl:-end-12" : "-start-4 xl:-start-12"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-5 ${side === "start" ? "rotate-180" : ""} rtl:-scale-x-100`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
