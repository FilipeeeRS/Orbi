"use client";

import { useEffect, useRef, useState } from "react";
import { ColorPicker } from "./color-picker";

export const THEME_KEY = "orbi-theme";

// Fundo e destaque de cada tema (iguais ao globals.css), usados na bolinha do seletor.
// "dark" e "light" são neutros (preto e branco); as famílias de cor têm versão clara e escura.
// "custom" é montado com as duas cores que a pessoa escolhe (CUSTOM_KEY).
export const THEMES = {
  dark: { bg: "#0b0b0c", accent: "#f2f2f3" },
  light: { bg: "#fafafa", accent: "#111113" },
  "fire-dark": { bg: "#0c0809", accent: "#ff3b52" },
  "fire-light": { bg: "#fbf6f6", accent: "#d11f3a" },
  "ocean-dark": { bg: "#070c12", accent: "#3b9eff" },
  "ocean-light": { bg: "#f5f9fd", accent: "#0b72d9" },
  "purple-dark": { bg: "#0d0a14", accent: "#a855f7" },
  "purple-light": { bg: "#f9f6fd", accent: "#8b2ff0" },
  "forest-dark": { bg: "#080d0a", accent: "#22c55e" },
  "forest-light": { bg: "#f5faf6", accent: "#15803d" },
  "sunset-dark": { bg: "#110b07", accent: "#ff8a1f" },
  "sunset-light": { bg: "#fdf8f3", accent: "#d9600b" },
  "pink-dark": { bg: "#120a0f", accent: "#ff5fa8" },
  "pink-light": { bg: "#fdf6fa", accent: "#d6247a" },
  custom: { bg: "#0b0b0c", accent: "#f2f2f3" },
} as const;
export type Theme = keyof typeof THEMES;
const THEME_NAMES = Object.keys(THEMES) as Theme[];

export const THEME_FAMILIES = ["neutral", "fire", "ocean", "purple", "pink", "forest", "sunset"] as const;
export type ThemeFamily = (typeof THEME_FAMILIES)[number];

function themeOf(family: ThemeFamily, mode: "dark" | "light"): Theme {
  return family === "neutral" ? mode : `${family}-${mode}`;
}

// Temas salvos por versões anteriores viram o equivalente atual.
const LEGACY: Record<string, Theme> = {
  purple: "purple-dark",
  ocean: "ocean-dark",
  forest: "forest-dark",
  sunset: "sunset-dark",
  "custom-dark": "custom",
  "custom-light": "custom",
};

// Cores do tema personalizado ({ accent, bg } em hex), salvas neste navegador.
export const CUSTOM_KEY = "orbi-theme-custom";
type CustomColors = { accent: string; bg: string };
const HEX = /^#[0-9a-f]{6}$/i;

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};

// Texto e esquema de cores derivados do fundo; texto do botão derivado do destaque.
function applyCustom({ accent, bg }: CustomColors) {
  const root = document.documentElement.style;
  const lightBg = luminance(bg) > 150;
  root.setProperty("--custom-bg", bg);
  root.setProperty("--custom-fg", lightBg ? "#111113" : "#f2f2f3");
  root.setProperty("--custom-scheme", lightBg ? "light" : "dark");
  root.setProperty("--custom-accent", accent);
  root.setProperty("--custom-accent-fg", luminance(accent) > 150 ? "#0b0b0c" : "#ffffff");
}

// Roda antes da hidratação para não piscar o tema errado (inclui as cores do personalizado).
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");var l=${JSON.stringify(LEGACY)};if(l[t]){t=l[t];localStorage.setItem("${THEME_KEY}",t)}document.documentElement.dataset.theme=${JSON.stringify(THEME_NAMES)}.indexOf(t)>=0?t:"dark";var c=JSON.parse(localStorage.getItem("${CUSTOM_KEY}")||"null");var h=/^#[0-9a-f]{6}$/i;if(c&&h.test(c.accent)&&h.test(c.bg)){var L=function(x){var n=parseInt(x.slice(1),16);return 0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255)};var s=document.documentElement.style,b=L(c.bg)>150;s.setProperty("--custom-bg",c.bg);s.setProperty("--custom-fg",b?"#111113":"#f2f2f3");s.setProperty("--custom-scheme",b?"light":"dark");s.setProperty("--custom-accent",c.accent);s.setProperty("--custom-accent-fg",L(c.accent)>150?"#0b0b0c":"#ffffff")}}catch(e){}`;

function storedCustom(): CustomColors | null {
  try {
    const c = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "null");
    return c && HEX.test(c.accent) && HEX.test(c.bg) ? c : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme as Theme;
  return THEME_NAMES.includes(t) ? t : "dark";
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}
}

// Botão do rodapé: alterna entre a versão clara e a escura do tema atual (do personalizado vai para o claro).
export function ThemeToggle() {
  function toggle() {
    const t = currentTheme();
    if (t === "custom") return applyTheme("light");
    applyTheme(t.endsWith("light") ? (t.replace(/light$/, "dark") as Theme) : (t.replace(/dark$/, "light") as Theme));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Tema claro/escuro"
      className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path className="hidden dark:block" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        <path className="dark:hidden" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}

const RAINBOW = "conic-gradient(from 90deg, #ff3b52, #ffd23f, #22c55e, #3b9eff, #a855f7, #ff3b52)";

function Swatch({ theme, custom }: { theme: Theme; custom?: CustomColors | null }) {
  // Personalizado sem cores escolhidas ainda: bolinha arco-íris.
  if (theme === "custom" && !custom) {
    return <span aria-hidden className="size-4 shrink-0 rounded-full ring-1 ring-border" style={{ background: RAINBOW }} />;
  }
  const { bg, accent } = theme === "custom" && custom ? custom : THEMES[theme];
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 rounded-full ring-1 ring-border"
      style={{ background: `linear-gradient(135deg, ${bg} 50%, ${accent} 50%)` }}
    />
  );
}

export type ThemeLabels = { dark: string; light: string } & Record<Exclude<ThemeFamily, "neutral">, string> & {
  custom: string;
  customBorder: string;
  customBg: string;
};

// Nome exibido: neutros são só "Dark"/"Light"; os outros, "Ocean Dark", "Fire Light"...
function themeLabel(theme: Theme, labels: ThemeLabels) {
  if (theme === "dark" || theme === "light" || theme === "custom") return labels[theme];
  const [family, mode] = theme.split("-") as [Exclude<ThemeFamily, "neutral">, "dark" | "light"];
  return `${labels[family]} ${labels[mode]}`;
}

// Lista de temas em Configurações: uma família por linha (escuro e claro lado a lado) e,
// no fim, "Personalizado", que mostra os controles de borda e fundo.
export function ThemeSelect({ labels, className }: { labels: ThemeLabels; className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [custom, setCustom] = useState<CustomColors | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o tema aplicado pelo script inicial
    setTheme(currentTheme());
    setCustom(storedCustom());
  }, []);

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

  function saveCustom(next: CustomColors) {
    setCustom(next);
    applyCustom(next);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {}
  }

  function change(next: Theme) {
    // Primeira vez no personalizado: começa com as cores do tema que estava ativo.
    if (next === "custom" && !custom) saveCustom({ ...THEMES[theme] });
    setTheme(next);
    setOpen(false);
    applyTheme(next);
  }

  const option = (name: Theme, wide = false) => (
    <li key={name} role="option" aria-selected={name === theme} className={wide ? "col-span-2" : undefined}>
      <button
        type="button"
        onClick={() => change(name)}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-surface-2 ${
          name === theme ? "bg-surface-2 font-semibold" : ""
        }`}
      >
        <Swatch theme={name} custom={custom} />
        {themeLabel(name, labels)}
      </button>
    </li>
  );

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={`${className ?? ""} flex items-center gap-2 text-start`}
        >
          <Swatch theme={theme} custom={custom} />
          <span className="flex-1">{themeLabel(theme, labels)}</span>
          <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 grid max-h-96 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl"
          >
            {THEME_FAMILIES.flatMap((family) => (["dark", "light"] as const).map((mode) => option(themeOf(family, mode))))}
            {option("custom", true)}
          </ul>
        )}
      </div>

      {theme === "custom" && custom && (
        <div className="grid grid-cols-2 gap-2">
          <ColorField label={labels.customBorder} value={custom.accent} onChange={(accent) => saveCustom({ ...custom, accent })} />
          <ColorField label={labels.customBg} value={custom.bg} onChange={(bg) => saveCustom({ ...custom, bg })} align="end" />
        </div>
      )}
    </div>
  );
}

// Botão com a cor atual; clicar abre a paleta e a mudança aplica na hora.
function ColorField({
  label,
  value,
  onChange,
  align,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  align?: "start" | "end";
}) {
  return (
    <ColorPicker
      value={value}
      onChange={onChange}
      label={label}
      align={align}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-start hover:bg-surface-2"
    >
      <span aria-hidden className="size-5 shrink-0 rounded-full ring-1 ring-border" style={{ background: value }} />
      <span className="flex-1">{label}</span>
      <span className="font-mono text-xs text-muted uppercase">{value}</span>
    </ColorPicker>
  );
}
