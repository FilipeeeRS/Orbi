"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  avatar: React.ReactNode;
  name: string;
  sections: { href: string; label: string }[][];
  signOutLabel: string;
};

// Fecha ao clicar num item, fora do menu, com Esc ou ao trocar de página.
export function UserMenu({ avatar, name, sections, signOutLabel }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-0.5 ps-0.5 pe-2 hover:bg-surface-2"
      >
        {avatar}
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{name}</span>
        <svg viewBox="0 0 20 20" className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <nav
          role="menu"
          className="absolute end-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface text-sm shadow-xl"
        >
          <p className="border-b border-border px-4 py-2 text-xs text-muted sm:hidden">{name}</p>
          {sections.map((links, i) => (
            <div key={i} className={`py-1 ${i < sections.length - 1 ? "border-b border-border" : ""}`}>
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-1.5 hover:bg-surface-2"
                >
                  {l.label}
                </Link>
              ))}
              {/* "Sair" fica no último grupo, junto de Importar e Configurações */}
              {i === sections.length - 1 && (
                <form action="/auth/signout" method="post">
                  <button role="menuitem" className="w-full px-4 py-1.5 text-start text-muted hover:bg-surface-2 hover:text-fg">
                    {signOutLabel}
                  </button>
                </form>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
