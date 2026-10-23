import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Loading from "../loading";
import { getDict, getViewer } from "@/lib/session";
import { getNotifications, getReadState, SOCIAL_KINDS, type Notification } from "@/lib/notifications";
import { NotificationRow } from "@/components/notification-row";
import { MarkAllRead } from "./mark-all-read";
import { EmptyState, PageHeader, TabNav } from "@/components/page-header";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.notifications.title };
}

// Filtros do topo: tudo, social (curtidas, comentários, seguidores), lançamentos, conta e as apagadas.
const FILTERS = ["all", "social", "release", "device", "deleted"] as const;
type Filter = (typeof FILTERS)[number];
const matches = (n: Notification, f: Filter) =>
  f === "all" || f === "deleted" || (f === "social" ? SOCIAL_KINDS.includes(n.kind) : n.kind === f);

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
  const [all, deleted, isRead] = await Promise.all([
    getNotifications(viewer.id, { limit: 100 }),
    getNotifications(viewer.id, { limit: 100, deleted: true }),
    getReadState(),
  ]);
  const list = filter === "deleted" ? deleted : all.filter((n) => matches(n, filter));
  const labels: Record<Filter, string> = {
    all: t.notifications.filters.all,
    social: t.notifications.filters.social,
    release: t.notifications.filters.releases,
    device: t.notifications.filters.account,
    deleted: t.notifications.filters.deleted,
  };

  return (
    <div className="space-y-4">
      <PageHeader back="/home" title={t.notifications.title} border={false}>
        <div className="pb-2">
          <MarkAllRead label={t.notifications.markAllRead} />
        </div>
      </PageHeader>
      {/* Filtros como abas, iguais às do perfil e da busca */}
      <TabNav
        tabs={FILTERS.map((f) => ({
          key: f,
          href: f === "all" ? "/notifications" : `/notifications?type=${f}`,
          label: labels[f],
          active: f === filter,
          count: f === "deleted" ? deleted.length : all.filter((n) => matches(n, f)).length,
        }))}
      />
      {list.length === 0 ? (
        <EmptyState>{t.notifications.empty}</EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((n) => (
            <NotificationRow key={n.id} n={n} read={isRead(n)} t={t} locale={locale} deleted={filter === "deleted"} />
          ))}
        </ul>
      )}
    </div>
  );
}
