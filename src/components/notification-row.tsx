import Link from "next/link";
import { Avatar } from "@/components/header";
import type { Notification } from "@/lib/notifications";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle } from "@/lib/types";

// Ícone de cada tipo (no canto da foto, ou no lugar dela quando não há pessoa).
const KIND_ICON = {
  commentLike: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  like: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  comment: { color: "text-accent", path: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z", fill: false },
  reply: { color: "text-accent", path: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5", fill: false },
  follow: { color: "text-ok", path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-3v6m3-3h-6", fill: false },
  release: { color: "text-star", path: "M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17l-6 3.3 1.3-6.7-5-4.6 6.8-.8z", fill: true },
  device: { color: "text-danger", path: "M5 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 20h8M12 16v4", fill: false },
  update: { color: "text-accent", path: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z", fill: false },
} as const;

function KindIcon({ kind, className }: { kind: Notification["kind"]; className: string }) {
  const icon = KIND_ICON[kind];
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${icon.color}`}
      fill={icon.fill ? "currentColor" : "none"}
      stroke={icon.fill ? "none" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={icon.path} />
    </svg>
  );
}

// Uma notificação: quem (ou o ícone do tipo), o que aconteceu, o texto do comentário e quando.
export function NotificationRow({
  n,
  unread,
  t,
  locale,
  compact = false,
}: {
  n: Notification;
  unread: boolean;
  t: Dictionary;
  locale: Locale;
  compact?: boolean; // Home: sem o texto do comentário
}) {
  const title = n.item ? itemTitle(n.item, locale) : "";
  const lang = dictionaries[locale].htmlLang;
  const en = locale === "pt" ? "pt" : "en";

  const text = {
    like: t.notifications.like(title),
    comment: t.notifications.comment(title),
    reply: t.notifications.reply(title),
    follow: t.notifications.follow,
    commentLike: t.notifications.commentLike(title),
    release: t.notifications.release(title),
    device: t.notifications.newDevice(n.body ?? ""),
    update: n.update?.title[en] ?? "",
  }[n.kind];
  const href = n.item
    ? itemHref(n.item)
    : n.kind === "device"
      ? "/settings"
      : n.kind === "update"
        ? "/about"
        : n.actor
          ? `/u/${n.actor.username}`
          : "/notifications";
  const detail = n.kind === "device" ? t.notifications.deviceHint : n.kind === "update" ? n.update?.body[en] : n.body;

  return (
    <li className={`relative flex gap-3 ${compact ? "py-3" : "py-4"} ${unread ? "" : "opacity-80"}`}>
      {unread && <span className="absolute top-6 -start-4 size-2 rounded-full bg-accent" aria-hidden />}
      {n.actor ? (
        <Link href={`/u/${n.actor.username}`} className="relative shrink-0">
          <Avatar profile={n.actor} size={40} ring={n.actor.avatar_ring} />
          <span className="absolute -end-1 -bottom-1 grid size-5 place-items-center rounded-full bg-surface">
            <KindIcon kind={n.kind} className="size-3" />
          </span>
        </Link>
      ) : (
        <Link href={href} className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2">
          <KindIcon kind={n.kind} className="size-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p>
          {n.actor && (
            <>
              <Link href={`/u/${n.actor.username}`} className="font-semibold hover:text-accent">
                {n.actor.display_name || n.actor.username}
              </Link>{" "}
            </>
          )}
          <Link href={href} className={n.actor ? "text-fg/85 hover:text-fg" : "font-semibold hover:text-accent"}>
            {text}
          </Link>
        </p>
        {detail && !compact && <p className="mt-1 line-clamp-2 text-muted whitespace-pre-line">{detail}</p>}
        <time dateTime={n.created_at} className="mt-1 block text-xs text-muted">
          {n.kind === "release" || n.kind === "update"
            ? new Date(n.created_at).toLocaleDateString(lang, { dateStyle: "medium" })
            : new Date(n.created_at).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}
        </time>
      </div>
    </li>
  );
}
