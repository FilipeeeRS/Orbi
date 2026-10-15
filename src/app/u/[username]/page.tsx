import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Poster, PosterGrid } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { getProfileByUsername, getProfileOverview } from "@/lib/queries";
import type { MediaKind } from "@/lib/types";
import { ProfileHeader } from "./profile-header";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const profile = await getProfileByUsername((await params).username);
  return { title: profile ? profile.display_name || profile.username : undefined };
}

const FOLDERS: MediaKind[] = ["movie", "series", "music", "game", "book"];

export default function ProfilePage(props: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ProfilePageContent {...props} />
    </Suspense>
  );
}

async function ProfilePageContent({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const [profile, viewer, { t, locale }] = await Promise.all([getProfileByUsername(username), getViewer(), getDict()]);
  if (!profile) notFound();

  const overview = await getProfileOverview(profile.id);
  const base = `/u/${profile.username}`;

  return (
    <div className="space-y-10">
      <ProfileHeader profile={profile} isOwner={viewer?.id === profile.id} editLabel={t.nav.settings} />

      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface text-center">
        <Stat label={t.profile.watched} value={overview.watched} href={`${base}/movies`} />
        <Stat label={t.profile.thisYear} value={overview.thisYear} href={`${base}/movies`} />
        <Stat label={t.profile.watchlist} value={overview.watchlist} href={`${base}/movies?tab=watchlist`} />
      </div>

      <section>
        <SectionTitle>{t.profile.folders}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FOLDERS.map((kind) =>
            kind === "movie" ? (
              <Link
                key={kind}
                href={`${base}/movies`}
                className="group relative flex h-32 flex-col justify-end overflow-hidden rounded-xl border border-border bg-surface p-3 hover:border-accent"
              >
                <div className="absolute inset-0 flex opacity-40 transition group-hover:opacity-60">
                  {overview.recent.slice(0, 4).map((e) =>
                    e.items.poster_url ? (
                      <div key={e.id} className="relative flex-1">
                        <Image src={e.items.poster_url} alt="" fill sizes="80px" className="object-cover" />
                      </div>
                    ) : null,
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
                <span className="relative font-semibold">{t.folders.movie}</span>
                <span className="relative text-xs text-muted">{t.profile.items(overview.watched + overview.watchlist)}</span>
              </Link>
            ) : (
              <div
                key={kind}
                className="flex h-32 flex-col justify-end rounded-xl border border-dashed border-border p-3 text-muted"
              >
                <span className="font-semibold">{t.folders[kind]}</span>
                <span className="text-xs">{t.folders.soon}</span>
              </div>
            ),
          )}
        </div>
      </section>

      {overview.favorites.length > 0 && (
        <section>
          <SectionTitle href={`${base}/movies?tab=liked`}>{t.profile.favorites}</SectionTitle>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {overview.favorites.map((e) => (
              <Poster key={e.id} item={e.items} locale={locale} showMeta={false} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle href={`${base}/movies`}>{t.profile.recent}</SectionTitle>
        {overview.recent.length ? (
          <PosterGrid>
            {overview.recent.map((e, i) => (
              <Poster key={e.id} item={e.items} locale={locale} rating={e.rating} liked={e.liked} eager={i < 6} />
            ))}
          </PosterGrid>
        ) : (
          <p className="text-sm text-muted">{t.profile.empty}</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="px-2 py-4 hover:bg-surface-2">
      <span className="block text-2xl font-bold tabular-nums">{value.toLocaleString()}</span>
      <span className="block text-xs text-muted">{label}</span>
    </Link>
  );
}

function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls = "mb-3 block border-b border-border pb-2 text-xs font-semibold tracking-widest text-muted uppercase";
  return href ? (
    <Link href={href} className={`${cls} hover:text-fg`}>
      {children}
    </Link>
  ) : (
    <h2 className={cls}>{children}</h2>
  );
}
