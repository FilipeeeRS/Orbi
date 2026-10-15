"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "orbi-theme";

// Roda antes da hidratação para não piscar o tema errado.
export const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("${THEME_KEY}")==="light"?"light":"dark"}catch(e){}`;

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
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

// Mesma escolha do botão do rodapé, só que em forma de lista (usada em Configurações).
export function ThemeSelect({ labels, className }: { labels: { dark: string; light: string }; className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o tema aplicado pelo script inicial
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function change(next: "dark" | "light") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  return (
    <select value={theme} onChange={(e) => change(e.target.value as "dark" | "light")} className={className}>
      <option value="dark">{labels.dark}</option>
      <option value="light">{labels.light}</option>
    </select>
  );
}
