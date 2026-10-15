import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/header";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

type Stat = { label: string; value: number; href: string };

// Faixa com o backdrop de um filme do usuário + avatar, nome e números.
export function ProfileHeader({
  profile,
  isOwner,
  backdrop,
  stats,
  t,
}: {
  profile: Profile;
  isOwner: boolean;
  backdrop: string | null;
  stats: Stat[];
  t: Dictionary;
}) {
  return (
    <div className="relative">
      <div className="relative -mx-4 -mt-6 h-40 overflow-hidden sm:-mt-8 sm:h-64 md:rounded-b-3xl">
        {backdrop ? (
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover opacity-70" loading="eager" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/10" />
      </div>

      <div className="relative -mt-16 flex flex-col gap-5 sm:-mt-20 md:flex-row md:items-end md:justify-between">
        <div className="flex items-end gap-4">
          <div className="rounded-full bg-bg p-1 shadow-2xl">
            <Avatar profile={profile} size={104} />
          </div>
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display truncate text-3xl font-extrabold tracking-tight sm:text-4xl">
                {profile.display_name || profile.username}
              </h1>
              {isOwner && (
                <Link
                  href="/settings"
                  className="rounded-md bg-surface-2 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-muted uppercase hover:text-fg"
                >
                  {t.profile.editProfile}
                </Link>
              )}
            </div>
            <p className="text-sm text-muted">@{profile.username}</p>
            {profile.bio && <p className="mt-2 max-w-lg text-sm text-balance">{profile.bio}</p>}
          </div>
        </div>

        <div className="flex divide-x divide-border rtl:divide-x-reverse">
          {stats.map((s) => (
            <div key={s.label} className="px-4 text-center first:ps-0 last:pe-0">
              <Link href={s.href} className="group block">
                <span className="font-display block text-2xl font-extrabold tabular-nums group-hover:text-accent">
                  {s.value.toLocaleString()}
                </span>
                <span className="block text-[10px] font-semibold tracking-widest text-muted uppercase">{s.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileTabs({ username, t }: { username: string; t: Dictionary }) {
  const base = `/u/${username}`;
  const tabs = [
    { href: base, label: t.profile.tab, active: true },
    { href: `${base}/movies`, label: t.folders.movie },
    { href: `${base}/movies?tab=reviews`, label: t.movies.tabs.reviews },
    { href: `${base}/movies?tab=watchlist`, label: t.movies.tabs.watchlist },
    { href: `${base}/movies?tab=liked`, label: t.movies.tabs.liked },
  ];
  return (
    <nav className="flex justify-center gap-1 overflow-x-auto rounded-xl border border-border bg-surface/60 px-2 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`border-b-2 px-3 py-3 whitespace-nowrap transition ${
            tab.active ? "border-accent font-semibold text-fg" : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
