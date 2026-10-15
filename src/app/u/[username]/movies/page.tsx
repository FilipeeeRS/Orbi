import { Suspense } from "react";
import Loading from "../../../loading";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Poster, PosterGrid, PosterImage } from "@/components/poster";
import { StarsDisplay } from "@/components/stars";
import { getDict, getViewer } from "@/lib/session";
import { getProfileByUsername, listEntries, PAGE_SIZE, SORTS, TABS, type Sort, type Tab } from "@/lib/queries";
import { itemHref, itemTitle } from "@/lib/types";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: "Filmes" };

export default function MoviesPage(props: PageProps<"/u/[username]/movies">) {
  return (
    <Suspense fallback={<Loading />}>
      <MoviesPageContent {...props} />
    </Suspense>
  );
}

async function MoviesPageContent({ params, searchParams }: PageProps<"/u/[username]/movies">) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const tab: Tab = TABS.includes(query.tab as Tab) ? (query.tab as Tab) : "watched";
  const sort: Sort = SORTS.includes(query.sort as Sort) ? (query.sort as Sort) : "recent";
  const page = Math.max(1, Number(query.page) || 1);

  const [profile, viewer, { t, locale }] = await Promise.all([getProfileByUsername(username), getViewer(), getDict()]);
  if (!profile) notFound();

  const { entries, total } = await listEntries(profile.id, tab, sort, page);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = `/u/${profile.username}/movies`;
  const href = (p: Partial<{ tab: Tab; sort: Sort; page: number }>) => {
    const next = { tab, sort, page: 1, ...p };
    const s = new URLSearchParams();
    if (next.tab !== "watched") s.set("tab", next.tab);
    if (next.sort !== "recent") s.set("sort", next.sort);
    if (next.page > 1) s.set("page", String(next.page));
    return s.size ? `${base}?${s}` : base;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* No perfil de outra pessoa, o @ mostra de quem é a pasta */}
          <Link
            href={`/u/${profile.username}`}
            aria-label={t.nav.profile}
            className="flex items-center gap-1 rounded-full p-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {viewer?.id !== profile.id && <span className="pe-1">@{profile.username}</span>}
          </Link>
          <h1 className="text-2xl font-bold">{t.folders.movie}</h1>
        </div>
        <span className="text-sm text-muted">{t.profile.items(total)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((key) => (
            <Link
              key={key}
              href={href({ tab: key })}
              className={`border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
                key === tab ? "border-accent font-semibold text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t.movies.tabs[key]}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-x-3 gap-y-1 pb-2 text-xs">
          {SORTS.filter((key) => !(tab === "watchlist" && key === "yours")).map((key) => (
            <Link
              key={key}
              href={href({ sort: key })}
              className={key === sort ? "font-semibold text-fg" : "text-muted hover:text-fg"}
            >
              {t.movies.sort[key]}
            </Link>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">{t.profile.empty}</p>
      ) : tab === "reviews" ? (
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="flex gap-4 py-5">
              <Link href={itemHref(e.items)} className="group w-16 shrink-0 sm:w-20">
                <PosterImage url={e.items.poster_url} title={itemTitle(e.items, locale)} />
              </Link>
              <div className="min-w-0">
                <Link href={itemHref(e.items)} className="font-semibold hover:text-accent">
                  {itemTitle(e.items, locale)} <span className="font-normal text-muted">{e.items.year}</span>
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-sm">
                  <StarsDisplay rating={e.rating} />
                  {e.liked && <span className="text-like">♥</span>}
                  {e.watched_on && (
                    <span className="text-xs text-muted">{formatDate(e.watched_on, locale)}</span>
                  )}
                </div>
                <p className="mt-2 text-sm whitespace-pre-line">{e.review}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <PosterGrid>
          {entries.map((e, i) => (
            <Poster key={e.id} item={e.items} locale={locale} rating={e.rating} liked={e.liked} eager={i < 8} />
          ))}
        </PosterGrid>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4 text-sm">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="hover:text-accent">
              ← {t.movies.prev}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">{t.movies.page(page, pages)}</span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className="hover:text-accent">
              {t.movies.next} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

function formatDate(isoDate: string, locale: Locale) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(dictionaries[locale].htmlLang);
}
