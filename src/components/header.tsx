import Link from "next/link";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { SearchBox } from "./search-box";
import type { MediaKind, Profile } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { countUnreadNotifications } from "@/lib/notifications";
import { Avatar } from "./avatar";

// Avatar mora em ./avatar (componentes do navegador importam de lá; este arquivo busca notificações no servidor).
export { Avatar };

const FOLDER_PATHS: Record<MediaKind, string> = { movie: "movies", series: "series", music: "music", game: "games", book: "books" };

// No menu as pastas ficam sempre nesta ordem (no perfil elas seguem a última adição).
const MENU_FOLDERS: MediaKind[] = ["movie", "series", "music", "game", "book"];

export async function Header({ viewer, t }: { viewer: Profile | null; t: Dictionary }) {
  const unread = viewer ? await countUnreadNotifications(viewer.id) : 0;
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Logo slogan={t.slogan} />
        <SearchBox placeholder={t.nav.search} />
        {viewer ? (
          <UserMenu
            avatar={<Avatar profile={viewer} size={30} ring={viewer.avatar_ring} />}
            name={viewer.display_name || viewer.username}
            unread={unread}
            sections={[
              [
                { href: "/", label: t.nav.home },
                { href: `/u/${viewer.username}`, label: t.profile.tab },
                { href: "/notifications", label: t.nav.notifications, icon: "bell", badge: unread },
                ...MENU_FOLDERS.map((kind) => ({ href: `/u/${viewer.username}/${FOLDER_PATHS[kind]}`, label: t.folders[kind] })),
              ],
              [
                { href: `/u/${viewer.username}/all`, label: t.folders.all },
                { href: `/u/${viewer.username}/all?tab=liked`, label: t.movies.tabs.liked },
                { href: `/u/${viewer.username}/all?tab=watchlist`, label: t.movies.tabs.watchlist },
                { href: `/u/${viewer.username}/all?tab=reviews`, label: t.movies.tabs.reviews },
              ],
              [
                { href: "/settings", label: t.nav.settings },
                { href: "/import", label: t.nav.import },
              ],
            ]}
            signOutLabel={t.nav.signOut}
          />
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            {t.nav.signIn}
          </Link>
        )}
      </div>
    </header>
  );
}

