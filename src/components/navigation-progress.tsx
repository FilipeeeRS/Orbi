"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Barrinha no topo da tela enquanto a próxima página carrega: o clique dá retorno na hora, mesmo
// quando o servidor demora a responder.
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [loading, setLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState(`${pathname}?${search}`);

  // Chegou a página nova: some a barra.
  const url = `${pathname}?${search}`;
  if (url !== lastUrl) {
    setLastUrl(url);
    setLoading(false);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const next = new URL(a.href, location.href);
      if (next.origin !== location.origin) return;
      if (next.pathname === location.pathname && next.search === location.search) return;
      setLoading(true);
    };
    const onPop = () => setLoading(true);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Segurança: se a navegação for cancelada, a barra não fica presa.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden" role="progressbar" aria-label="Loading">
      <div className="h-full w-1/3 animate-[orbi-progress_1.1s_ease-in-out_infinite] bg-accent" />
    </div>
  );
}
