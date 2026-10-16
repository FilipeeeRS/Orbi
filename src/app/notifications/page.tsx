import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Loading from "../loading";
import { Avatar } from "@/components/header";
import { getDict, getViewer } from "@/lib/session";
import { getNotifications, getNotificationsSeenAt, type Notification } from "@/lib/notifications";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle } from "@/lib/types";
import { MarkSeen } from "./mark-seen";

export const metadata: Metadata = { title: "Notificações" };

export default function NotificationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NotificationsContent />
    </Suspense>
  );
}

async function NotificationsContent() {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  if (!viewer) redirect("/login?next=/notifications");
  const [list, seenAt] = await Promise.all([getNotifications(viewer.id), getNotificationsSeenAt()]);

  return (
    <div className="mx-auto max-w-2xl">
      <MarkSeen />
      <h1 className="font-display mb-6 text-3xl font-extrabold tracking-tight">{t.notifications.title}</h1>
      {list.length === 0 ? (
        <p className="text-muted">{t.notifications.empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((n) => (
            <NotificationRow key={n.id} n={n} unread={!seenAt || n.created_at > seenAt} t={t} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}

const KIND_ICON = {
  commentLike: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  like: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  comment: { color: "text-accent", path: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z", fill: false },
  reply: { color: "text-accent", path: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5", fill: false },
  follow: { color: "text-ok", path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-3v6m3-3h-6", fill: false },
} as const;

function NotificationRow({ n, unread, t, locale }: { n: Notification; unread: boolean; t: Dictionary; locale: Locale }) {
  const name = n.actor.display_name || n.actor.username;
  const title = n.item ? itemTitle(n.item, locale) : "";
  const text = {
    like: t.notifications.like(title),
    comment: t.notifications.comment(title),
    reply: t.notifications.reply(title),
    follow: t.notifications.follow,
    commentLike: t.notifications.commentLike(title),
  }[n.kind];
  const href = n.item ? itemHref(n.item) : `/u/${n.actor.username}`;
  const icon = KIND_ICON[n.kind];
  const lang = dictionaries[locale].htmlLang;

  return (
    <li className={`relative flex gap-3 py-4 ${unread ? "" : "opacity-80"}`}>
      {unread && <span className="absolute top-6 -start-4 size-2 rounded-full bg-accent" aria-hidden />}
      <Link href={`/u/${n.actor.username}`} className="relative shrink-0">
        <Avatar profile={n.actor} size={40} ring={n.actor.avatar_ring} />
        <span className={`absolute -end-1 -bottom-1 grid size-5 place-items-center rounded-full bg-surface ${icon.color}`}>
          <svg viewBox="0 0 24 24" className="size-3" fill={icon.fill ? "currentColor" : "none"} stroke={icon.fill ? "none" : "currentColor"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={icon.path} />
          </svg>
        </span>
      </Link>
      <div className="min-w-0 flex-1 text-sm">
        <p>
          <Link href={`/u/${n.actor.username}`} className="font-semibold hover:text-accent">
            {name}
          </Link>{" "}
          <Link href={href} className="text-fg/85 hover:text-fg">
            {text}
          </Link>
        </p>
        {n.body && <p className="mt-1 line-clamp-2 text-muted whitespace-pre-line">{n.body}</p>}
        <time dateTime={n.created_at} className="mt-1 block text-xs text-muted">
          {new Date(n.created_at).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}
        </time>
      </div>
    </li>
  );
}
