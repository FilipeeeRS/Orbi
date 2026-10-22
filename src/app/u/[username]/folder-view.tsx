import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { notFound } from "next/navigation";
import { Poster, PosterGrid, PosterImage } from "@/components/poster";
import { StarsDisplay } from "@/components/stars";
import { getDict, getViewer } from "@/lib/session";
import {
  DEFAULT_SORT,
  getProfileByUsername,
  getViewerStates,
  listEntries,
  PAGE_SIZE,
  SORTS,
  TABS,
  type ListFilters,
  type Sort,
  type Tab,
} from "@/lib/queries";
import { getMovieGenres, tmdbLanguage } from "@/lib/tmdb";
import { CATALOG_GENRES, mirrorReady } from "@/lib/anime-db";
import { sortOptions } from "@/lib/sort-options";
import { FilterBar } from "@/components/filter-bar";
import { itemHref, itemTitle, type FolderKind } from "@/lib/types";
import { ReviewAttachments } from "@/components/review-attachments";
import { TranslatableText } from "@/components/translatable-text";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";
import { getUserLists, LIST_SORTS, type UserListSort } from "@/lib/lists";
import { ListsGrid } from "@/app/lists/lists-grid";
import { BackButton } from "@/components/back-button";

// Listagem de uma pasta (filmes, séries, músicas, jogos ou livros) do perfil, com abas e ordenação.
export async function FolderView({
  username,
  query,
  kind,
  path,
}: {
  username: string;
  query: Record<string, string | string[] | undefined>;
  kind: FolderKind;
  path: string;
}) {
  const tab: Tab = TABS.includes(query.tab as Tab) ? (query.tab as Tab) : "watched";
  const sort: Sort = SORTS.includes(query.sort as Sort) ? (query.sort as Sort) : DEFAULT_SORT;
  const page = Math.max(1, Number(query.page) || 1);
  // Animes e mangás filtram o gênero pelo nome (AniList); filmes e séries pelo id do TMDB.
  const aniList = kind === "anime" || kind === "manga";
  const filters: ListFilters = {
    decade: Number(query.decade) || undefined,
    genre: aniList ? undefined : Number(query.genre) || undefined,
    genreName: aniList && typeof query.genre === "string" ? query.genre : undefined,
    rating: query.rating === "none" ? "none" : Number(query.rating) || undefined,
    q: typeof query.q === "string" ? query.q : undefined,
  };

  const [profile, viewer, { t, locale }] = await Promise.all([getProfileByUsername(username), getViewer(), getDict()]);
  if (!profile) notFound();

  const [{ entries, total }, genres] = await Promise.all([
    listEntries(profile.id, tab, sort, page, kind, filters, locale, viewer?.id ?? null),
    kind === "movie" || kind === "all"
      ? getMovieGenres(tmdbLanguage(locale))
      : kind === "series"
        ? getMovieGenres(tmdbLanguage(locale), "tv")
        : // Só depois da cópia do AniList no banco existe a coluna de gêneros para filtrar.
          aniList
          ? mirrorReady(kind).then((ready) => (ready ? CATALOG_GENRES.map((name) => ({ id: name, name })) : []))
          : Promise.resolve([]),
  ]);
  const states = viewer ? await getViewerStates(viewer.id, entries.map((e) => e.item_id)) : null;
  // Aba Listas: as listas personalizadas do perfil (de todas as pastas)
  const listSort: UserListSort = LIST_SORTS.includes(query.sort as UserListSort) ? (query.sort as UserListSort) : "recent";
  const lists = tab === "lists" ? await getUserLists(profile.id, listSort, filters.q) : null;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = `/u/${profile.username}/${path}`;
  // Mantém filtros e ordenação ao trocar de aba ou de página.
  const href = (p: Partial<{ tab: Tab; page: number }>) => {
    const next = { tab, page: 1, ...p };
    const s = new URLSearchParams();
    if (next.tab !== "watched") s.set("tab", next.tab);
    if (sort !== DEFAULT_SORT) s.set("sort", sort);
    for (const key of ["decade", "genre", "rating", "q"] as const) {
      const value = query[key];
      if (typeof value === "string" && value) s.set(key, value);
    }
    if (next.page > 1) s.set("page", String(next.page));
    return s.size ? `${base}?${s}` : base;
  };
  const lang = dictionaries[locale].htmlLang;
  // "Mais bem avaliados por você" não faz sentido na watchlist (ainda não tem nota sua).
  const sorts = sortOptions(
    SORTS.filter((key) => !(tab === "watchlist" && key === "yours")),
    t,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* No perfil de outra pessoa, o @ mostra de quem é a pasta */}
          <BackButton
            fallback={`/u/${profile.username}`}
            label={t.common.back}
            className="flex items-center gap-1 rounded-full p-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
          >
            {viewer?.id !== profile.id && <span className="pe-1">@{profile.username}</span>}
          </BackButton>
          {/* A sua pasta "Tudo" vira "Seu tudo"; a dos outros continua "Tudo" (com o @ ao lado) */}
          <h1 className="font-display text-2xl font-extrabold">
            {kind === "all" && viewer?.id === profile.id ? t.folders.yourAll : t.folders[kind]}
          </h1>
        </div>
        <span className="text-sm text-muted">{t.profile.items(total)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.filter((key) => key !== "watching" || kind !== "movie").map((key) => (
            <Link
              key={key}
              href={href({ tab: key })}
              className={`border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
                key === tab ? "border-accent font-semibold text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {/* Mangá: "Lidos" e "Lendo" no lugar de "Vistos" e "Assistindo" */}
              {/* Livros e mangás: Lidos/Lendo; jogos: Jogados/Jogando; o resto: Vistos/Assistindo */}
              {key === "watched" || key === "watching"
                ? kind === "manga" || kind === "book"
                  ? t.manga.tabs[key]
                  : kind === "game"
                    ? t.game.tabs[key]
                    : t.movies.tabs[key]
                : t.movies.tabs[key]}
            </Link>
          ))}
        </nav>
        {/* Listas: só ordenar (popularidade pelas curtidas, nome, data) e a lupa */}
        {tab === "lists" && (
          <FilterBar
            labels={t.movies.filters}
            defaultSort="recent"
            sorts={sortOptions(LIST_SORTS, t)}
            decades={[]}
            genres={[]}
            ratings={[]}
          />
        )}
        {tab !== "lists" && (
          <FilterBar
            labels={t.movies.filters}
            defaultSort={DEFAULT_SORT}
            sorts={sorts}
            decades={Array.from({ length: 13 }, (_, i) => 2020 - i * 10).map((d) => ({
              value: String(d),
              label: `${d}s`,
            }))}
            genres={genres.map((g) => ({ value: String(g.id), label: g.name }))}
            ratings={[
              ...Array.from({ length: 10 }, (_, i) => 10 - i).map((r) => ({
                value: String(r),
                label: `${"★".repeat(Math.floor(r / 2))}${r % 2 ? "½" : ""}  ${(r / 2).toLocaleString(lang)}`,
              })),
              { value: "none", label: t.movies.filters.noRating },
            ]}
          />
        )}
      </div>

      {lists ? (
        <ListsGrid lists={lists} canCreate={viewer?.id === profile.id} username={profile.username} viewerId={viewer?.id ?? null} t={t} />
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">{t.profile.empty}</p>
      ) : tab === "reviews" ? (
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="flex gap-4 py-5">
              <Link href={itemHref(e.items)} className="group w-16 shrink-0 self-start sm:w-20">
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
                {e.review && <TranslatableText text={e.review} className="mt-2 text-sm whitespace-pre-line" />}
                <ReviewAttachments attachments={e.attachments} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <PosterGrid>
          {entries.map((e, i) => (
            <Poster badge={false}
              key={e.id}
              item={e.items}
              locale={locale}
              eager={i < 8}
              viewer={viewer ? { id: viewer.id, state: states?.get(e.item_id) ?? null } : null}
            />
          ))}
        </PosterGrid>
      )}

      <Pagination page={page} pages={pages} hrefFor={(n) => href({ page: n })} t={t} />
    </div>
  );
}

function formatDate(isoDate: string, locale: Locale) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(dictionaries[locale].htmlLang);
}
