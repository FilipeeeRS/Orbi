"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./i18n";
import { useQuickLog } from "./quick-log";

// Barra fixa embaixo da tela no celular (como num aplicativo): Início, Buscar, + Registrar,
// Notificações e Perfil. No computador some (o topo já tem tudo).
export function BottomNav({ username, unread }: { username: string | null; unread: Promise<number> }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { open } = useQuickLog();
  const profile = username ? `/u/${username}` : "/login";
  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${active ? "text-fg" : "text-muted"}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="flex items-stretch">
        <Link href="/home" className={item(pathname === "/" || pathname === "/home")}>
          <Icon d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          {t.nav.home}
        </Link>
        <Link href="/search" className={item(pathname === "/search")}>
          <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-3.5-3.5" />
          {t.footer.search}
        </Link>
        <button type="button" onClick={open} className={item(false)} aria-label={t.quickLog.button}>
          <span className="-mt-1 grid size-9 place-items-center rounded-full bg-accent text-accent-fg shadow-lg">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          {t.quickLog.button}
        </button>
        <Link href={username ? "/notifications" : "/login?next=/notifications"} className={item(pathname === "/notifications")}>
          <span className="relative">
            <Icon d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            <Suspense>
              <UnreadDot unread={unread} />
            </Suspense>
          </span>
          {t.nav.notifications}
        </Link>
        <Link href={profile} className={item(!!username && pathname.startsWith(`/u/${username}`))}>
          <Icon d="M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          {username ? t.profile.tab : t.nav.signIn}
        </Link>
      </div>
    </nav>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function UnreadDot({ unread }: { unread: Promise<number> }) {
  if (use(unread) === 0) return null;
  return <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-bg" aria-hidden />;
}
