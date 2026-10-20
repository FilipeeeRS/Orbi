import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Loading from "../loading";
import { getDict, getViewer } from "@/lib/session";
import { getNotifications, getReadState, SOCIAL_KINDS, type Notification } from "@/lib/notifications";
import { NotificationRow } from "@/components/notification-row";
import { MarkAllRead } from "./mark-all-read";

export const metadata: Metadata = { title: "Notificações" };

// Filtros do topo: tudo, social (curtidas, comentários, seguidores), lançamentos e conta.
const FILTERS = ["all", "social", "release", "device"] as const;
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
  const [all, isRead] = await Promise.all([getNotifications(viewer.id, { limit: 100 }), getReadState()]);
  const list = all.filter((n) => matches(n, filter));
  const labels: Record<Filter, string> = {
    all: t.notifications.filters.all,
    social: t.notifications.filters.social,
    release: t.notifications.filters.releases,
    device: t.notifications.filters.account,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.notifications.title}</h1>
        <MarkAllRead label={t.notifications.markAllRead} />
      </div>
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
        <ul className="divide-y divide-border ps-4">
          {list.map((n) => (
            <NotificationRow key={n.id} n={n} read={isRead(n)} t={t} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}
