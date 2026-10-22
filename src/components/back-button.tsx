"use client";

import { startTransition, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Histórico desta aba dentro do site (cada entrada = uma URL, com o caminho separado). Trocar de aba,
// filtro ou página na mesma tela cria entradas com o mesmo caminho; a seta pula todas elas.
type Entry = { path: string; url: string };
const KEY = "orbi-nav-history";
let wentBack = false; // a última mudança foi um "voltar" (seta ou botão do navegador)

function read(): Entry[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function write(list: Entry[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(-80)));
  } catch {}
}

// Fica no layout: registra cada URL visitada e, ao voltar, recarrega a tela anterior para ela mostrar
// o que mudou (ex.: status trocado na página da obra), em vez da versão guardada.
export function NavigationTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();

  useEffect(() => {
    const onPop = () => (wentBack = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const url = search ? `${pathname}?${search}` : pathname;
    const list = read();
    if (list.at(-1)?.url !== url) {
      // Voltou para uma URL de antes (seta ou navegador): corta o que estava depois dela.
      const earlier = wentBack ? list.map((e) => e.url).lastIndexOf(url) : -1;
      if (earlier >= 0) list.splice(earlier + 1);
      else list.push({ path: pathname, url });
      write(list);
    }
    if (wentBack) {
      wentBack = false;
      startTransition(() => router.refresh());
    }
  }, [pathname, search, router]);
  return null;
}

// Seta "voltar": volta para a tela anterior de verdade, pulando as trocas de filtro/aba/página da tela
// atual. Se a pessoa chegou direto nesta página (link de fora, aba nova), vai para `fallback`.
export function BackButton({
  fallback,
  label,
  className = "grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg",
  children,
}: {
  fallback: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        const list = read();
        // Quantas entradas no fim do histórico são desta mesma tela
        let same = 0;
        while (same < list.length && list[list.length - 1 - same].path === location.pathname) same++;
        if (same > 0 && same < list.length) {
          wentBack = true;
          window.history.go(-same);
        } else {
          router.push(fallback);
        }
      }}
      className={className}
    >
      <svg viewBox="0 0 24 24" className="size-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}
