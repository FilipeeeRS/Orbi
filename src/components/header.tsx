import Link from "next/link";
import Image from "next/image";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { SearchBox } from "./search-box";
import type { MediaKind, Profile } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const FOLDER_PATHS: Record<MediaKind, string> = { movie: "movies", series: "series", music: "music", game: "games", book: "books" };

// No menu as pastas ficam sempre nesta ordem (no perfil elas seguem a última adição).
const MENU_FOLDERS: MediaKind[] = ["movie", "series", "music", "game", "book"];

export function Header({ viewer, t }: { viewer: Profile | null; t: Dictionary }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Logo slogan={t.slogan} />
        <SearchBox placeholder={t.nav.search} />
        {viewer ? (
          <UserMenu
            avatar={<Avatar profile={viewer} size={30} />}
            name={viewer.display_name || viewer.username}
            sections={[
              [
                { href: "/", label: t.nav.home },
                { href: `/u/${viewer.username}`, label: t.profile.tab },
                ...MENU_FOLDERS.map((kind) => ({ href: `/u/${viewer.username}/${FOLDER_PATHS[kind]}`, label: t.folders[kind] })),
              ],
              [
                { href: `/u/${viewer.username}/all`, label: t.folders.all },
                { href: `/u/${viewer.username}/all?tab=liked`, label: t.movies.tabs.liked },
                { href: `/u/${viewer.username}/all?tab=watchlist`, label: t.movies.tabs.watchlist },
                { href: `/u/${viewer.username}/all?tab=reviews`, label: t.movies.tabs.reviews },
              ],
              [
                { href: "/import", label: t.nav.import },
                { href: "/settings", label: t.nav.settings },
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

export function Avatar({ profile, size }: { profile: Pick<Profile, "avatar_url" | "username" | "display_name">; size: number }) {
  const label = profile.display_name || profile.username;
  return profile.avatar_url ? (
    <Image
      src={profile.avatar_url}
      alt={label}
      width={size}
      height={size}
      className="rounded-full object-cover ring-1 ring-border"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="grid place-items-center rounded-full bg-accent font-bold text-accent-fg"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}
