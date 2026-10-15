"use client";

import { useEffect, useRef, useState } from "react";

// Linha de pastas com rolagem horizontal: 5 visíveis no desktop e setas para ver o resto.
export function FolderCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const x = Math.abs(el.scrollLeft); // em RTL o scrollLeft é negativo
      setCanPrev(x > 1);
      setCanNext(x + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollBy({ left: dir * rtl * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:w-[calc((100%-0.75rem)/2.2)] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[calc((100%-1.5rem)/3)] lg:[&>*]:w-[calc((100%-3rem)/5)]"
      >
        {children}
      </div>
      {canPrev && <Arrow side="start" onClick={() => scroll(-1)} />}
      {canNext && <Arrow side="end" onClick={() => scroll(1)} />}
    </div>
  );
}

function Arrow({ side, onClick }: { side: "start" | "end"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "end" ? "→" : "←"}
      className={`absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-fg shadow-xl backdrop-blur transition hover:border-accent hover:text-accent ${
        side === "end" ? "-end-3" : "-start-3"
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
