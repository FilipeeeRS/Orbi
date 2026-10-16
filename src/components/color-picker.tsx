"use client";

import { useEffect, useRef, useState } from "react";

// Cores prontas da paleta (8 por linha): vivas, depois metais/neutros, depois escuros.
const PRESETS = [
  "#ff3b52", "#ff5fa8", "#d6247a", "#a855f7", "#6d28d9", "#3b9eff", "#0b72d9", "#06b6d4",
  "#14b8a6", "#22c55e", "#84cc16", "#ffd23f", "#e0b43c", "#ff8a1f", "#d9600b", "#b76e79",
  "#ffffff", "#f2f2f3", "#c9ced6", "#94949c", "#4b4b52", "#1d1d20", "#0b0b0c", "#000000",
];
const HEX = /^#[0-9a-f]{6}$/i;

function hslToHex(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

// Paleta que abre abaixo do botão: cores prontas, barra de matiz, código hex e o seletor do sistema.
// Cada mudança chama onChange na hora (prévia ao vivo).
export function ColorPicker({
  value,
  onChange,
  label,
  children,
  className,
  align = "start",
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
  children: React.ReactNode; // conteúdo do botão que abre a paleta
  className?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(hex: string) {
    const next = hex.toLowerCase();
    setDraft(next);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => {
          setDraft(value);
          setOpen(!open);
        }}
        className={className}
      >
        {children}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute top-full z-30 mt-2 w-64 space-y-3 rounded-xl border border-border bg-surface p-3 shadow-2xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          <div className="grid grid-cols-8 gap-1.5">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pick(c)}
                aria-label={c}
                className={`aspect-square rounded-full ring-1 ring-border transition hover:scale-110 ${
                  c === value.toLowerCase() ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={359}
            value={hexToHue(HEX.test(draft) ? draft : value)}
            onChange={(e) => pick(hslToHex(Number(e.target.value), 85, 55))}
            aria-label="Hue"
            className="h-3 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background:
                "linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)",
            }}
          />
          <div className="flex items-center gap-2">
            <span aria-hidden className="size-8 shrink-0 rounded-lg ring-1 ring-border" style={{ background: value }} />
            <input
              value={draft}
              onChange={(e) => {
                const v = e.target.value.trim();
                setDraft(v);
                const hex = v.startsWith("#") ? v : `#${v}`;
                if (HEX.test(hex)) onChange(hex.toLowerCase());
              }}
              maxLength={7}
              spellCheck={false}
              aria-label="Hex"
              className="w-full min-w-0 rounded-lg border border-border bg-bg px-2 py-1.5 font-mono text-xs uppercase outline-none focus:border-accent"
            />
            {/* Seletor do sistema, para quem quiser o controle completo */}
            <label className="relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-border hover:bg-surface-2">
              <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 21a9 9 0 1 1 0-18c5 0 9 3.6 9 8 0 2.8-2.2 4-4 4h-1.5a1.5 1.5 0 0 0-1 2.6A1.5 1.5 0 0 1 12 21Z" />
                <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
                <circle cx="12" cy="7.5" r="1" fill="currentColor" />
                <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
              </svg>
              <input
                type="color"
                value={HEX.test(value) ? value : "#000000"}
                onChange={(e) => pick(e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
