import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Loading from "../../loading";
import { FolderIcon } from "@/components/folder-icon";
import { Poster, PosterImage } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { getProfileByUsername, getProfileOverview } from "@/lib/queries";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle, type EntryWithItem, type MediaKind } from "@/lib/types";
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

  const o = await getProfileOverview(profile.id);
  const base = `/u/${profile.username}`;
  const isOwner = viewer?.id === profile.id;
  const backdrop = [...o.favorites, ...o.recent].find((e) => e.items.backdrop_url)?.items.backdrop_url ?? null;
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
            href: base,
          })),
        ]}
      />

      <Folders base={base} recent={o.recent} count={o.watched + o.watchlist} t={t} />

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
                    <Poster key={e.id} item={e.items} locale={locale} showMeta={false} eager={i < 4} />
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
                    <Poster key={e.id} item={e.items} locale={locale} rating={e.rating} liked={e.liked} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-10">
            <section>
              <SectionTitle href={`${base}/movies?tab=watchlist`} more={o.watchlist.toLocaleString()}>
                {t.profile.watchlist}
              </SectionTitle>
              <Link href={`${base}/movies?tab=watchlist`} className="group flex">
                {Array.from({ length: 5 }, (_, i) => o.watchlistPreview[i]).map((e, i) => (
                  <div
                    key={e?.id ?? i}
                    className="w-1/5 shrink-0 transition-transform group-hover:-translate-y-1"
                    style={{ zIndex: 5 - i, transitionDelay: `${i * 30}ms` }}
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

// Distribuição das notas de todas as pastas em 5 degraus (1 a 5 estrelas), com a média.
// Meias estrelas entram no degrau de baixo: ½, 1 e 1½ → 1★; 2 e 2½ → 2★ ... 4 e 4½ → 4★; 5 → 5★.
function RatingHistogram({ counts, averageLabel }: { counts: number[]; averageLabel: string }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const average = total ? counts.reduce((sum, c, i) => sum + c * (i + 1), 0) / total / 2 : null;
  const steps = [0, 0, 0, 0, 0];
  counts.forEach((c, i) => (steps[Math.max(0, Math.floor((i + 1) / 2) - 1)] += c));
  const max = Math.max(1, ...steps);
  return (
    <div className="flex items-end gap-2" title={average !== null ? `${averageLabel}: ${average.toFixed(1)}` : undefined}>
      <span className="text-xs text-star">★</span>
      <div className="flex h-16 flex-1 items-end gap-1">
        {steps.map((c, i) => (
          <div
            key={i}
            title={`${"★".repeat(i + 1)} · ${c}`}
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

function Folders({ base, recent, count, t }: { base: string; recent: EntryWithItem[]; count: number; t: Dictionary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {FOLDERS.map((kind) =>
        kind === "movie" ? (
          <Link
            key={kind}
            href={`${base}/movies`}
            className="group relative col-span-2 flex h-28 flex-col justify-end overflow-hidden rounded-xl border border-border bg-surface p-3 hover:border-accent sm:col-span-1"
          >
            <div className="absolute inset-0 flex opacity-50 transition group-hover:opacity-70">
              {recent.slice(0, 3).map((e) =>
                e.items.poster_url ? (
                  <div key={e.id} className="relative flex-1">
                    <Image src={e.items.poster_url} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                ) : null,
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
            <span className="relative flex items-center gap-1.5 font-semibold">
              <FolderIcon kind={kind} className="size-4 text-accent" />
              {t.folders.movie}
            </span>
            <span className="relative text-xs text-muted">{t.profile.items(count)}</span>
          </Link>
        ) : (
          <div
            key={kind}
            className="flex h-28 flex-col justify-between rounded-xl border border-dashed border-border p-3 text-muted/70"
          >
            <FolderIcon kind={kind} className="size-6" />
            <div>
              <span className="block text-sm font-semibold">{t.folders[kind]}</span>
              <span className="text-[11px]">{t.folders.soon}</span>
            </div>
          </div>
        ),
      )}
    </div>
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
