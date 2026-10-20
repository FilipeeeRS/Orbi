import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Loading from "../loading";
import { getDict, getViewer } from "@/lib/session";
import { getNotifications, getNotificationsSeenAt, SOCIAL_KINDS, type Notification } from "@/lib/notifications";
import { NotificationRow } from "@/components/notification-row";
import { MarkSeen } from "./mark-seen";

export const metadata: Metadata = { title: "Notificações" };

// Filtros do topo: tudo, social (curtidas, comentários, seguidores), lançamentos, conta e novidades do Orbi.
const FILTERS = ["all", "social", "release", "device", "update"] as const;
type Filter = (typeof FILTERS)[number];
const matches = (n: Notification, f: Filter) =>
  f === "all" || (f === "social" ? SOCIAL_KINDS.includes(n.kind) : n.kind === f);

export default function NotificationsPage(props: PageProps<"/notifications">) {
  return (
    <Suspense fallback={<Loading />}>
      <NotificationsContent {...props} />
    </Suspense>
  );
}

async function NotificationsContent({ searchParams }: PageProps<"/notifications">) {
  const [viewer, { t, locale }, query] = await Promise.all([getViewer(), getDict(), searchParams]);
  if (!viewer) redirect("/login?next=/notifications");
  const filter: Filter = FILTERS.includes(query.type as Filter) ? (query.type as Filter) : "all";
  const [all, seenAt] = await Promise.all([getNotifications(viewer.id, { limit: 100 }), getNotificationsSeenAt()]);
  const list = all.filter((n) => matches(n, filter));
  const labels: Record<Filter, string> = {
    all: t.notifications.filters.all,
    social: t.notifications.filters.social,
    release: t.notifications.filters.releases,
    device: t.notifications.filters.account,
    update: t.notifications.filters.updates,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <MarkSeen />
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight">{t.notifications.title}</h1>
      <nav className="mb-2 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const count = all.filter((n) => matches(n, f)).length;
          return (
            <Link
              key={f}
              href={f === "all" ? "/notifications" : `/notifications?type=${f}`}
              scroll={false}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                f === filter ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-fg hover:text-fg"
              }`}
            >
              {labels[f]} <span className="font-normal opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>
      {list.length === 0 ? (
        <p className="py-6 text-muted">{t.notifications.empty}</p>
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
