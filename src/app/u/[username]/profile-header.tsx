import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/header";
import { ringBackground } from "@/lib/avatar-ring";
import { CopyLinkButton } from "./copy-link-button";
import { BackButton } from "@/components/back-button";
import { ExportImageButton } from "./export-image-button";
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
      {/* Seta de voltar por cima da capa (sem tela anterior, vai para a Home) */}
      <BackButton fallback="/home" className="absolute start-0 top-2 z-10 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65" />
      {/* O espaço da capa existe sempre; sem capa ele só fica vazio */}
      <div className="backdrop-fade relative -mt-6 ml-[calc(50%-min(50vw,700px))] h-56 w-[min(100vw,1400px)] overflow-hidden sm:-mt-8 sm:h-96">
        {backdrop && (
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover object-[center_30%]" loading="eager" />
        )}
      </div>

      {/* Sticker do perfil: imagem sem fundo no canto direito da capa, acima dos números */}
      {profile.sticker_url && (
        // eslint-disable-next-line @next/next/no-img-element -- tamanho livre (proporção do sticker), direto do Storage
        <img
          src={profile.sticker_url}
          alt=""
          className="pointer-events-none absolute top-4 right-0 z-10 h-28 max-w-[40%] object-contain drop-shadow-2xl sm:top-10 sm:h-48"
        />
      )}

      <div className="relative -mt-24 flex flex-col gap-5 sm:-mt-36 md:flex-row md:items-end md:justify-between">
        <div className="flex items-end gap-4">
          <div className={`rounded-full shadow-2xl ${ringBackground(profile.avatar_ring) ? "" : "bg-bg p-1"}`}>
            <Avatar profile={profile} size={104} ring={profile.avatar_ring} />
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
              <ExportImageButton username={profile.username} label={t.profile.exportImage} />
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
                  title={profile.website}
                  className="flex min-w-0 items-center gap-1 hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                  </svg>
                  {/* Sem "https://www." e cortado com "…" quando é longo; o link completo fica no clique e no title */}
                  {shortUrl(profile.website)}
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

const URL_MAX = 40;

// "https://www.canada.ca/en/immigration-refugees-citizenship/..." → "canada.ca/en/immigration-refugees-citiz…"
function shortUrl(url: string) {
  const clean = url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
  return clean.length > URL_MAX ? `${clean.slice(0, URL_MAX).trimEnd()}…` : clean;
}
