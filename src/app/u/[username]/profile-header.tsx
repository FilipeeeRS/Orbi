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
              {profile.pronouns && <span className="text-sm text-muted">{profile.pronouns}</span>}
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
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
              <span>@{profile.username}</span>
              {profile.location && (
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1 hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                  </svg>
                  {/* Mostra só o domínio, sem "https://www." */}
                  {profile.website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
                </a>
              )}
            </p>
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
