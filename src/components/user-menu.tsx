"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuLink = { href: string; label: string; icon?: "bell" };

type Props = {
  avatar: React.ReactNode;
  name: string;
  // Notificações não lidas (ponto na foto e número no sino). Chega depois: o cabeçalho e a página
  // aparecem sem esperar a contagem.
  unread: Promise<number>;
  sections: MenuLink[][];
  signOutLabel: string;
};

// Fecha ao clicar num item, fora do menu, com Esc ou ao trocar de página.
export function UserMenu({ avatar, name, unread, sections, signOutLabel }: Props) {
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
        {/* flex: sem isso a foto fica na linha do texto e ganha um respiro embaixo (descentralizada) */}
        <span className="relative flex shrink-0">
          {avatar}
          <Suspense>
            <UnreadDot unread={unread} />
          </Suspense>
        </span>
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
                  className="flex items-center gap-2 px-4 py-1.5 hover:bg-surface-2"
                >
                  <span className="flex-1">{l.label}</span>
                  {/* Sino à direita; com notificação não lida, a contagem fica no canto dele */}
                  {l.icon === "bell" && (
                    <span className="relative">
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4 text-muted"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                      </svg>
                      <Suspense>
                        <UnreadBadge unread={unread} />
                      </Suspense>
                    </span>
                  )}
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

function UnreadDot({ unread }: { unread: Promise<number> }) {
  if (use(unread) === 0) return null;
  return <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-bg" aria-hidden />;
}

function UnreadBadge({ unread }: { unread: Promise<number> }) {
  const n = use(unread);
  if (n === 0) return null;
  return (
    <span className="absolute -end-2 -top-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-bold text-accent-fg tabular-nums ring-2 ring-surface">
      {n > 9 ? "9+" : n}
    </span>
  );
}
