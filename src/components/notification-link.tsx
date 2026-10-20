"use client";

import Link from "next/link";
import { useState } from "react";

// Cookie com as notificações já abertas (chaves curtas, as 150 mais recentes).
const COOKIE = "orbi-notif-read";

// A notificação inteira é um link; ao clicar, ela fica como lida (cinza) e o número do menu diminui.
export function NotificationLink({
  href,
  readKey,
  read: initiallyRead,
  className,
  children,
}: {
  href: string;
  readKey: string;
  read: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [read, setRead] = useState(initiallyRead);

  function markRead() {
    if (read) return;
    setRead(true);
    const current = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))?.[1] ?? "";
    const keys = [readKey, ...decodeURIComponent(current).split(".").filter((k) => k && k !== readKey)].slice(0, 150);
    document.cookie = `${COOKIE}=${encodeURIComponent(keys.join("."))}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <Link
      href={href}
      onClick={markRead}
      className={`${className ?? ""} ${read ? "text-muted opacity-70" : ""}`}
      data-read={read || undefined}
    >
      {!read && <span className="absolute top-6 -start-4 size-2 rounded-full bg-accent" aria-hidden />}
      {children}
    </Link>
  );
}
