import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Loading from "../../loading";
import { FolderIcon } from "@/components/folder-icon";
import { Poster, PosterImage } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import {
  getFolderOrder,
  getFriends,
  getProfileByUsername,
  getProfileOverview,
  getViewerStates,
  isFollowing,
} from "@/lib/queries";
import { FolderCarousel } from "./folder-carousel";
import { Avatar } from "@/components/header";
import { FollowButton } from "./follow-button";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle, type EntryWithItem, type FolderKind, type MediaKind } from "@/lib/types";
import { ProfileHeader } from "./profile-header";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const profile = await getProfileByUsername((await params).username);
  return { title: profile ? profile.display_name || profile.username : undefined };
}

const FOLDERS: MediaKind[] = ["movie", "series", "music", "game", "book"];
const FOLDER_PATHS: Record<FolderKind, string> = {
  all: "all",
  movie: "movies",
  series: "series",
  music: "music",
  game: "games",
  book: "books",
};

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

  const isOwner = viewer?.id === profile.id;
  const [o, friends, following, folderOrder] = await Promise.all([
    getProfileOverview(profile.id),
    getFriends(profile.id),
    viewer && !isOwner ? isFollowing(viewer.id, profile.id) : false,
    getFolderOrder(profile.id),
  ]);
  const base = `/u/${profile.username}`;
  const states = viewer
    ? await getViewerStates(viewer.id, [...o.favorites, ...o.recent].map((e) => e.item_id))
    : null;
  const viewerFor = (itemId: string) => (viewer ? { id: viewer.id, state: states?.get(itemId) ?? null } : null);
  // Só a capa escolhida pelo usuário; sem ela, o topo do perfil fica sem imagem.
  const backdrop = profile.cover_url ?? null;
  const diary = o.recent.filter((e) => e.watched_on).slice(0, 8);

  return (
    <div className="space-y-8">
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        backdrop={backdrop}
        t={t}
        stats={[
          { label: t.folders.movie, value: o.watched, href: `${base}/movies` },
          // As outras pastas só aparecem nos números quando tiverem algo
          ...FOLDERS.filter((k) => k !== "movie" && o.kindCounts[k]).map((k) => ({
            label: t.folders[k],
            value: o.kindCounts[k]!,
            href: `${base}/${FOLDER_PATHS[k]}`,
          })),
          ...(friends.count ? [{ label: t.profile.friends, value: friends.count, href: "#friends" }] : []),
        ]}
        action={
          viewer && !isOwner ? (
            <FollowButton
              viewerId={viewer.id}
              profileId={profile.id}
              initial={following}
              labels={{ add: t.profile.addFriend, is: t.profile.isFriend, remove: t.profile.removeFriend }}
            />
          ) : null
        }
      />

      <Folders base={base} recent={o.recent} counts={folderCounts(o)} order={folderOrder} t={t} />

      {o.watched + o.watchlist === 0 ? (
        <EmptyProfile isOwner={isOwner} t={t} />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 space-y-10">
            {o.favorites.length > 0 && (
              <section>
                <SectionTitle href={`${base}/movies?tab=liked`} more={t.profile.all}>
                  {t.profile.favorites}
                </SectionTitle>
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {o.favorites.map((e, i) => (
                    <Poster
                      key={e.id}
                      item={e.items}
                      locale={locale}
                      showMeta={false}
                      eager={i < 4}
                      viewer={viewerFor(e.item_id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {o.recent.length > 0 && (
              <section>
                <SectionTitle href={`${base}/movies`} more={t.profile.all}>
                  {t.profile.recent}
                </SectionTitle>
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {o.recent.slice(0, 8).map((e) => (
                    <Poster
                      key={e.id}
                      item={e.items}
                      locale={locale}
                      rating={e.rating}
                      liked={e.liked}
                      viewer={viewerFor(e.item_id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {friends.count > 0 && (
              <section id="friends" className="scroll-mt-24">
                <SectionTitle more={friends.count.toLocaleString()}>{t.profile.friends}</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {friends.list.map((f) => (
                    <Link
                      key={f.id}
                      href={`/u/${f.username}`}
                      title={f.display_name || f.username}
                      className="rounded-full ring-2 ring-transparent transition hover:ring-accent"
                    >
                      <Avatar profile={f} size={44} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-10">
            <section>
              <SectionTitle more={o.watchlist.toLocaleString()}>
                {t.profile.watchlist}
              </SectionTitle>
              <Link href={`${base}/movies?tab=watchlist`} className="group flex">
                {Array.from({ length: 5 }, (_, i) => o.watchlistPreview[i]).map((e, i) => (
                  <div
                    key={e?.id ?? i}
                    className="w-1/5 shrink-0"
                    style={{ zIndex: 5 - i }}
                  >
                    <div className="-me-3 rounded-md shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                      {e ? (
                        <PosterImage url={e.items.poster_url} title={itemTitle(e.items, locale)} />
                      ) : (
                        <div className="aspect-[2/3] rounded-md border border-border bg-surface-2" />
                      )}
                    </div>
                  </div>
                ))}
              </Link>
            </section>

            <section>
              <SectionTitle more={o.ratingCounts.reduce((a, b) => a + b, 0).toLocaleString()}>
                {t.profile.ratings}
              </SectionTitle>
              <RatingHistogram counts={o.ratingCounts} averageLabel={t.profile.average} />
            </section>

            {diary.length > 0 && (
              <section>
                <SectionTitle href={`${base}/movies`} more={t.profile.all}>
                  {t.profile.diary}
                </SectionTitle>
                <Diary entries={diary} locale={locale} />
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, href, more }: { children: React.ReactNode; href?: string; more?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
      <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">{children}</h2>
      {more &&
        (href ? (
          <Link href={href} className="text-[11px] tracking-wider text-muted uppercase hover:text-accent">
            {more}
          </Link>
        ) : (
          <span className="text-[11px] tracking-wider text-muted">{more}</span>
        ))}
    </div>
  );
}

// Distribuição das notas (½★ a ★★★★★) de todas as pastas, com a média.
function RatingHistogram({ counts, averageLabel }: { counts: number[]; averageLabel: string }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...counts);
  const average = total ? counts.reduce((sum, c, i) => sum + c * (i + 1), 0) / total / 2 : null;
  return (
    <div className="flex items-end gap-2" title={average !== null ? `${averageLabel}: ${average.toFixed(1)}` : undefined}>
      <span className="text-xs text-star">★</span>
      <div className="flex h-16 flex-1 items-end gap-[3px]">
        {counts.map((c, i) => (
          <div
            key={i}
            title={`${(i + 1) / 2}★ · ${c}`}
            className="flex-1 rounded-t-sm bg-muted/40 transition hover:bg-accent"
            style={{ height: c ? `${Math.max(6, (c / max) * 100)}%` : "2px" }}
          />
        ))}
      </div>
      {/* Média em destaque logo acima das cinco estrelas */}
      <div className="flex flex-col items-end">
        {average !== null && (
          <span className="font-display text-2xl leading-none font-extrabold tabular-nums">{average.toFixed(1)}</span>
        )}
        <span className="text-xs tracking-tighter whitespace-nowrap text-star">★★★★★</span>
      </div>
    </div>
  );
}

function Diary({ entries, locale }: { entries: EntryWithItem[]; locale: Locale }) {
  const lang = dictionaries[locale].htmlLang;
  return (
    <ul className="space-y-1">
      {entries.map((e, i) => {
        const [y, m, d] = e.watched_on!.split("-").map(Number);
        const month = new Date(y, m - 1, d).toLocaleDateString(lang, { month: "short" }).replace(".", "");
        // Só mostra o mês na primeira entrada de cada mês, como no diário do Letterboxd
        const showMonth = i === 0 || entries[i - 1].watched_on!.slice(0, 7) !== e.watched_on!.slice(0, 7);
        return (
          <li key={e.id} className="flex items-center gap-3 text-sm">
            <span
              className={`grid w-10 shrink-0 place-items-center rounded-md border border-border py-0.5 text-[10px] font-bold tracking-wider text-muted uppercase ${
                showMonth ? "" : "invisible"
              }`}
            >
              {month}
            </span>
            <span className="w-5 text-end text-xs text-muted tabular-nums">{d}</span>
            <Link href={itemHref(e.items)} className="truncate hover:text-accent">
              {itemTitle(e.items, locale)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function folderCounts(o: Awaited<ReturnType<typeof getProfileOverview>>): Record<FolderKind, number> {
  const movie = o.watched + o.watchlist;
  const others = FOLDERS.filter((k) => k !== "movie").map((k) => [k, o.kindCounts[k] ?? 0] as const);
  return {
    all: movie + others.reduce((sum, [, n]) => sum + n, 0),
    movie,
    ...Object.fromEntries(others),
  } as Record<FolderKind, number>;
}

// "Tudo" primeiro, depois cada pasta. Pastas com itens ganham a colagem de pôsteres.
function Folders({
  base,
  recent,
  counts,
  order,
  t,
}: {
  base: string;
  recent: EntryWithItem[];
  counts: Record<FolderKind, number>;
  order: MediaKind[];
  t: Dictionary;
}) {
  // "Tudo" fica fixo em primeiro; as outras seguem a que recebeu item por último.
  const kinds: FolderKind[] = ["all", ...order];
  return (
    <FolderCarousel>
      {kinds.map((kind) => {
        const posters = kind === "all" || kind === "movie" ? recent.filter((e) => e.items.poster_url).slice(0, 3) : [];
        return counts[kind] > 0 ? (
          <Link
            key={kind}
            href={`${base}/${FOLDER_PATHS[kind]}`}
            className="group relative flex h-28 flex-col justify-end overflow-hidden rounded-xl border border-border bg-surface p-3 hover:border-accent"
          >
            <div className="absolute inset-0 flex opacity-50 transition group-hover:opacity-70">
              {posters.map((e) => (
                <div key={e.id} className="relative flex-1">
                  <Image src={e.items.poster_url!} alt="" fill sizes="80px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
            <span className="relative flex items-center gap-1.5 font-semibold">
              <FolderIcon kind={kind} className="size-4 text-accent" />
              {t.folders[kind]}
            </span>
            <span className="relative text-xs text-muted">{t.profile.items(counts[kind])}</span>
          </Link>
        ) : (
          <Link
            key={kind}
            href={`${base}/${FOLDER_PATHS[kind]}`}
            className="flex h-28 flex-col justify-end rounded-xl border border-dashed border-border p-3 text-muted/70 transition hover:border-accent hover:text-fg"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <FolderIcon kind={kind} className="size-4" />
              {t.folders[kind]}
            </span>
            <span className="text-xs">{t.profile.items(0)}</span>
          </Link>
        );
      })}
      <div
        aria-disabled
        title={t.folders.inDevelopment}
        className="flex h-28 cursor-not-allowed flex-col justify-between rounded-xl border border-dashed border-border bg-surface/30 p-3 text-muted/50"
      >
        <div className="flex items-center justify-between">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <div>
          <span className="block text-sm font-semibold">{t.folders.createList}</span>
          <span className="text-[11px]">{t.folders.inDevelopment}</span>
        </div>
      </div>
    </FolderCarousel>
  );
}

function EmptyProfile({ isOwner, t }: { isOwner: boolean; t: Dictionary }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <FolderIcon kind="movie" className="size-10 text-accent" />
      <p className="max-w-sm text-muted text-balance">{isOwner ? t.profile.emptyOwner : t.profile.empty}</p>
      {isOwner && (
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/import"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            {t.profile.importCta}
          </Link>
          <Link href="/search" className="rounded-full border border-border px-5 py-2 text-sm hover:bg-surface-2">
            {t.profile.searchCta}
          </Link>
        </div>
      )}
    </div>
  );
}
