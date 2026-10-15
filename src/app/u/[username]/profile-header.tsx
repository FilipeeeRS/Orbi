import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/header";
import { CopyLinkButton } from "./copy-link-button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

type Stat = { label: string; value: number; href: string };

// Faixa com o backdrop de um filme do usuário + avatar, nome e números.
export function ProfileHeader({
  profile,
  isOwner,
  backdrop,
  stats,
  action,
  t,
}: {
  profile: Profile;
  isOwner: boolean;
  backdrop: string | null;
  stats: Stat[];
  action?: React.ReactNode;
  t: Dictionary;
}) {
  return (
    <div className="relative">
      {/* O espaço da capa existe sempre; sem capa ele só fica vazio */}
      <div className="backdrop-fade relative left-1/2 -mt-6 h-56 w-screen max-w-[1400px] -translate-x-1/2 overflow-hidden sm:-mt-8 sm:h-96">
        {backdrop && (
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover object-[center_30%]" loading="eager" />
        )}
      </div>

      <div className="relative -mt-24 flex flex-col gap-5 sm:-mt-36 md:flex-row md:items-end md:justify-between">
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
              <CopyLinkButton path={`/u/${profile.username}`} label={t.profile.copyLink} copiedLabel={t.profile.copied} />
              {action}
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
