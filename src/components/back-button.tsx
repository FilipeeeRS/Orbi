"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Quantas páginas a pessoa já abriu dentro do site nesta aba (contadas pelo NavigationTracker).
let visited = 0;

// Fica no layout: conta cada troca de página feita dentro do site.
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    visited++;
  }, [pathname]);
  return null;
}

// Seta "voltar": volta para a tela anterior (como o botão do navegador). Se a pessoa chegou direto
// nesta página (link de fora, aba nova), vai para `fallback`.
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
        if (visited > 1) {
          e.preventDefault();
          router.back();
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
