import Link from "next/link";
import Image from "next/image";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import type { Profile } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Header({ viewer, t }: { viewer: Profile | null; t: Dictionary }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Logo />
        <form action="/search" className="ml-auto w-full max-w-xs">
          <input
            name="q"
            type="search"
            placeholder={t.nav.search}
            className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </form>
        <ThemeToggle />
        {viewer ? (
          <details className="relative">
            <summary className="block cursor-pointer list-none rounded-full [&::-webkit-details-marker]:hidden">
              <Avatar profile={viewer} size={32} />
            </summary>
            <nav className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 text-sm shadow-xl">
              <MenuLink href={`/u/${viewer.username}`}>{t.nav.profile}</MenuLink>
              <MenuLink href="/import">{t.nav.import}</MenuLink>
              <MenuLink href="/settings">{t.nav.settings}</MenuLink>
              <form action="/auth/signout" method="post">
                <button className="w-full px-4 py-2 text-left text-muted hover:bg-surface-2 hover:text-fg">
                  {t.nav.signOut}
                </button>
              </form>
            </nav>
          </details>
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

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2 hover:bg-surface-2">
      {children}
    </Link>
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
