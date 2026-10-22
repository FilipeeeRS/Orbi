import { Avatar } from "@/components/header";
import { FolderIcon } from "@/components/folder-icon";
import { OrbiMark } from "@/components/logo";
import { NotificationItem } from "@/components/notification-link";
import { notificationKey, type Notification } from "@/lib/notifications";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle, type FolderKind } from "@/lib/types";

// Ícone pequeno no canto da foto (notificações de pessoas).
const KIND_ICON = {
  commentLike: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  like: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  comment: { color: "text-accent", path: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z", fill: false },
  listLike: { color: "text-like", path: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z", fill: true },
  listComment: { color: "text-accent", path: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z", fill: false },
  reply: { color: "text-accent", path: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5", fill: false },
  follow: { color: "text-ok", path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-3v6m3-3h-6", fill: false },
} as const;

// Ícone grande no lugar da foto: o tema da notificação (a pasta da obra, o aparelho, o Orbi).
function TopicIcon({ n }: { n: Notification }) {
  if (n.kind === "welcome") return <OrbiMark className="size-6 text-accent" />;
  if (n.kind === "release" && n.item) {
    const kind = (n.item.kind === "season" ? "series" : n.item.kind) as FolderKind;
    return <FolderIcon kind={kind} className="size-5 text-star" />;
  }
  // Novo acesso: um aparelho
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-danger" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 20h8M12 16v4" />
    </svg>
  );
}

// Uma notificação, inteira clicável: a foto de quem fez (ou o ícone do tema), o que aconteceu,
// o texto do comentário e quando. Lida = cinza.
export function NotificationRow({
  n,
  read,
  t,
  locale,
  compact = false,
  deleted = false,
}: {
  n: Notification;
  read: boolean;
  t: Dictionary;
  locale: Locale;
  compact?: boolean; // Home: sem o texto do comentário
  deleted?: boolean; // no filtro "Apagadas": o ✕ apaga de vez
}) {
  const title = n.item ? itemTitle(n.item, locale) : "";
  const lang = dictionaries[locale].htmlLang;

  const text = {
    like: t.notifications.like(title),
    comment: t.notifications.comment(title),
    reply: t.notifications.reply(title),
    follow: t.notifications.follow,
    commentLike: t.notifications.commentLike(title),
    listLike: t.notifications.listLike(n.list?.title ?? ""),
    listComment: t.notifications.listComment(n.list?.title ?? ""),
    release: t.notifications.release(title),
    device: t.notifications.newDevice(n.body ?? ""),
    welcome: t.notifications.welcome,
  }[n.kind];
  const href = n.list
    ? `/u/${n.list.username}/list/${n.list.id}${n.kind === "listComment" ? "#comments" : ""}`
    : n.item
    ? itemHref(n.item)
    : n.kind === "device"
      ? "/settings"
      : n.kind === "welcome"
        ? "/about"
        : n.actor
          ? `/u/${n.actor.username}`
          : "/notifications";
  const detail = n.kind === "device" ? t.notifications.deviceHint : n.kind === "welcome" ? t.notifications.welcomeHint : n.body;
  // Data: na Home (compacta) embaixo do texto; na tela de notificações, à direita na mesma linha.
  const when = (
    <time dateTime={n.created_at} className={compact ? "mt-1 block text-xs opacity-60" : "shrink-0 text-end text-xs opacity-60"}>
      {n.kind === "release"
        ? new Date(n.created_at).toLocaleDateString(lang, { dateStyle: "medium" })
        : new Date(n.created_at).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
  const icon = n.kind in KIND_ICON ? KIND_ICON[n.kind as keyof typeof KIND_ICON] : null;

  return (
      <NotificationItem
        href={href}
        readKey={notificationKey(n.id)}
        read={read}
        deleted={deleted}
        className={`relative -mx-2 flex gap-3 rounded-lg ps-2 transition hover:bg-surface-2 ${compact ? "py-3" : "py-4"}`}
      >
        {n.actor ? (
          <span className="relative shrink-0">
            <Avatar profile={n.actor} size={40} ring={n.actor.avatar_ring} />
            {icon && (
              <span className={`absolute -end-1 -bottom-1 grid size-5 place-items-center rounded-full bg-surface ${icon.color}`}>
                <svg viewBox="0 0 24 24" className="size-3" fill={icon.fill ? "currentColor" : "none"} stroke={icon.fill ? "none" : "currentColor"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={icon.path} />
                </svg>
              </span>
            )}
          </span>
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2">
            <TopicIcon n={n} />
          </span>
        )}
        <span className="min-w-0 flex-1 text-sm">
          <span className="block">
            {n.actor && <span className="font-semibold">{n.actor.display_name || n.actor.username} </span>}
            <span className={n.actor ? "" : "font-semibold"}>{text}</span>
          </span>
          {detail && !compact && <span className="mt-1 line-clamp-2 block whitespace-pre-line opacity-75">{detail}</span>}
          {/* Home (compacta): data embaixo do texto */}
          {compact && when}
        </span>
        {/* Tela de notificações: data e hora à direita, na mesma linha */}
        {!compact && when}
      </NotificationItem>
  );
}
