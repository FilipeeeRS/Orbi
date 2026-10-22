"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n";

// Cookies com as chaves curtas das notificações: abertas/lidas, apagadas e apagadas de vez.
export const READ_COOKIE = "orbi-notif-read";
export const DELETED_COOKIE = "orbi-notif-deleted";
export const GONE_COOKIE = "orbi-notif-gone";

function addKey(cookie: string, key: string) {
  const current = document.cookie.match(new RegExp(`(?:^|; )${cookie}=([^;]*)`))?.[1] ?? "";
  const keys = [key, ...decodeURIComponent(current).split(".").filter((k) => k && k !== key)].slice(0, 200);
  document.cookie = `${cookie}=${encodeURIComponent(keys.join("."))}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

// Uma notificação: a linha inteira é um link (ao clicar, fica lida/cinza). À direita, a bolinha de
// não lida, ✓ para marcar como lida e ✕ para apagar (vai para "Apagadas"; lá, o ✕ apaga de vez).
export function NotificationItem({
  href,
  readKey,
  read: initiallyRead,
  deleted,
  className,
  children,
}: {
  href: string;
  readKey: string;
  read: boolean;
  deleted: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [read, setRead] = useState(initiallyRead);
  const [hidden, setHidden] = useState(false);

  function markRead() {
    if (read) return;
    setRead(true);
    addKey(READ_COOKIE, readKey);
    startTransition(() => router.refresh()); // o número do menu diminui
  }

  function remove() {
    setHidden(true);
    addKey(deleted ? GONE_COOKIE : DELETED_COOKIE, readKey);
    if (!read) addKey(READ_COOKIE, readKey);
    startTransition(() => router.refresh()); // contagens dos filtros e do menu
  }

  if (hidden) return null;
  const action = "grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg";

  return (
    <li className="relative">
      <Link href={href} onClick={markRead} className={`${className ?? ""} pe-24 ${read ? "text-muted opacity-70" : ""}`} data-read={read || undefined}>
        {children}
      </Link>
      <div className="absolute end-0 top-3 flex items-center gap-0.5">
        {!read && (
          <button type="button" onClick={markRead} title={t.notifications.markRead} aria-label={t.notifications.markRead} className={action}>
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          title={deleted ? t.notifications.deleteForever : t.notifications.delete}
          aria-label={deleted ? t.notifications.deleteForever : t.notifications.delete}
          className={`${action} hover:text-danger`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {/* Bolinha de não lida, na ponta direita */}
        <span className={`ms-1 size-2 rounded-full ${read ? "bg-transparent" : "bg-accent"}`} aria-hidden />
      </div>
    </li>
  );
}
