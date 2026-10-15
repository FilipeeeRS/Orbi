import Link from "next/link";
import Image from "next/image";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { Profile } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Header({ viewer, t }: { viewer: Profile | null; t: Dictionary }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Logo />
        <form action="/search" className="ms-auto w-full max-w-xs">
          <input
            name="q"
            type="search"
            placeholder={t.nav.search}
            className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </form>
        <ThemeToggle />
        {viewer ? (
          <UserMenu
            avatar={<Avatar profile={viewer} size={30} />}
            name={viewer.display_name || viewer.username}
            sections={[
              [
                { href: `/u/${viewer.username}`, label: t.nav.profile },
                { href: `/u/${viewer.username}/movies`, label: t.folders.movie },
                { href: `/u/${viewer.username}/movies?tab=reviews`, label: t.movies.tabs.reviews },
                { href: `/u/${viewer.username}/movies?tab=watchlist`, label: t.movies.tabs.watchlist },
                { href: `/u/${viewer.username}/movies?tab=liked`, label: t.movies.tabs.liked },
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
