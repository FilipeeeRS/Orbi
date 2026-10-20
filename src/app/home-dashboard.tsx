import Link from "next/link";
import { Avatar } from "@/components/header";
import { FolderIcon } from "@/components/folder-icon";
import { Poster, PosterImage } from "@/components/poster";
import type { ViewerItemState } from "@/components/poster-actions";
import { StarsDisplay } from "@/components/stars";
import { ExternalPosters, type ExternalPoster } from "@/components/external-posters";
import { getFriendsActivity, getPopularItems, getPopularReviews, getViewerShelf } from "@/lib/home";
import { browseMovies } from "@/lib/browse";
import { browseCatalog } from "@/lib/anime-db";
import { browseBooks } from "@/lib/openlibrary";
import { browseGames } from "@/lib/steam";
import { getReviewCommentCounts, getReviewLikes, getViewerStates } from "@/lib/queries";
import { getNotifications, getReadState } from "@/lib/notifications";
import { NotificationRow } from "@/components/notification-row";
import { getPopularLists } from "@/lib/lists";
import { releaseYear, tmdbImage, tmdbLanguage } from "@/lib/tmdb";
import { ReviewLike } from "@/components/review-like";
import { ReviewAttachments } from "@/components/review-attachments";
import { TranslatableText } from "@/components/translatable-text";
import { ReviewComments } from "@/components/review-comments";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle, MEDIA_KINDS, type Item, type MediaKind, type Profile } from "@/lib/types";

// "Ver tudo": o catálogo da pasta (populares de todos os tempos; a fileira de populares abre em "Esta semana").
const BROWSE_PATHS: Record<MediaKind, string> = { movie: "movies", series: "series", book: "books", anime: "anime", manga: "manga", game: "games", music: "music" };

type Tab = "news" | MediaKind;

// Tela inicial: boas-vindas e abas. "Novidades" (a primeira, aberta ao carregar) tem a atividade dos
// amigos e as reviews populares; cada pasta tem três fileiras: populares da semana (anime: a temporada),
// a prateleira pessoal (watchlist, ou assistindo/lendo) e uma amostra de tudo da pasta.
// Visitante (viewer null) vê as mesmas abas, sem a prateleira pessoal; marcar ou curtir leva para o login.
export async function HomeDashboard({
  viewer,
  t,
  locale,
  folder,
}: {
  viewer: Profile | null;
  t: Dictionary;
  locale: Locale;
  folder?: string | string[];
}) {
  const tab: Tab = MEDIA_KINDS.includes(folder as MediaKind) ? (folder as MediaKind) : "news";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {viewer ? t.home.welcome(viewer.display_name || viewer.username) : t.home.welcomeSub}
        </h1>
        {viewer && <p className="mt-1 text-muted">{t.home.welcomeSub}</p>}
      </header>

      {/* Abas: Novidades + uma por pasta (mesma ordem do resto do site) */}
      <nav className="flex gap-5 overflow-x-auto border-b border-border [scrollbar-width:none]">
        {(["news", ...MEDIA_KINDS] as Tab[]).map((key) => (
          <Link
            key={key}
            href={key === "news" ? "?" : `?folder=${key}`}
            scroll={false}
            className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2 text-xs font-semibold tracking-widest whitespace-nowrap uppercase transition ${
              key === tab ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {key !== "news" && <FolderIcon kind={key} className="size-3.5" />}
            {key === "news" ? t.home.newsTab : t.folders[key]}
          </Link>
        ))}
      </nav>

      {tab === "news" ? (
        <NewsTab viewer={viewer} t={t} locale={locale} />
      ) : (
        <FolderTab kind={tab} viewer={viewer} t={t} locale={locale} />
      )}
    </div>
  );
}

// Novidades: as últimas notificações (para quem está logado), a atividade dos amigos e as reviews populares.
async function NewsTab({ viewer, t, locale }: { viewer: Profile | null; t: Dictionary; locale: Locale }) {
  const [friends, reviews, notifications, isRead, watchlist, lists] = await Promise.all([
    viewer ? getFriendsActivity(viewer.id) : [],
    getPopularReviews(6),
    viewer ? getNotifications(viewer.id, { limit: 5 }) : [],
    getReadState(),
    // Minha watchlist de todas as pastas, das adicionadas por último
    viewer ? getViewerShelf(viewer.id, "all", "watchlist") : ([] as Item[]),
    getPopularLists(3),
  ]);
  const states = await getViewerStates(
    viewer?.id ?? "",
    viewer ? [...friends.map((e) => e.item_id), ...reviews.map((r) => r.item_id), ...watchlist.map((i) => i.id)] : [],
  );
  const viewerFor = (itemId: string) => (viewer ? { id: viewer.id, state: states.get(itemId) ?? null } : null);
  const [reviewLikes, commentCounts] = await Promise.all([
    getReviewLikes(reviews.map((r) => r.id), viewer?.id ?? null),
    getReviewCommentCounts(reviews.map((r) => r.id)),
  ]);

  return (
    <div className="space-y-12">
      {/* Logado: as últimas notificações (lançamentos da watchlist, seguidores, curtidas, novidades do Orbi) */}
      {viewer ? (
        <Section title={t.notifications.title} more={{ href: "/notifications", label: t.profile.all }}>
          {notifications.length ? (
            <ul className="divide-y divide-border ps-4">
              {notifications.map((n) => (
                <NotificationRow key={n.id} n={n} read={isRead(n)} t={t} locale={locale} compact />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              {t.notifications.empty}
            </p>
          )}
        </Section>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          {t.home.newsSoon}
        </div>
      )}

      {/* Logado: o que os amigos avaliaram por último, com a foto de quem avaliou no canto */}
      {friends.length > 0 && (
        <Section title={t.home.newFromFriends}>
          <Row>
            {friends.map((e, i) => (
              <div key={e.id} className="relative">
                <Poster item={e.items} locale={locale} eager={i < 6} viewer={viewerFor(e.item_id)} />
                <Link
                  href={`/u/${e.profiles.username}`}
                  className="absolute start-1.5 top-1.5 z-10 rounded-full ring-2 ring-bg transition hover:scale-110"
                  title={e.profiles.display_name || e.profiles.username}
                >
                  <Avatar profile={e.profiles} size={24} />
                </Link>
              </div>
            ))}
          </Row>
        </Section>
      )}

      {/* Logado: a sua watchlist (todas as pastas), embaixo das notificações */}
      {viewer && (
        <Section
          title={t.home.yourWatchlist}
          more={watchlist.length ? { href: `/u/${viewer.username}/all?tab=watchlist`, label: t.profile.all } : undefined}
        >
          {watchlist.length ? (
            <Row>
              {watchlist.map((item, i) => (
                <Poster key={item.id} item={item} locale={locale} eager={i < 6} viewer={viewerFor(item.id)} />
              ))}
            </Row>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              {t.home.emptyWatchlist}
            </p>
          )}
        </Section>
      )}

      {/* Listas dos usuários (públicas) com mais movimento na semana: 3 por vez, pôsteres em fileira */}
      {lists.length > 0 && (
        <Section title={t.home.popularLists}>
          <div className="grid gap-6 sm:grid-cols-3">
            {lists.map((list) => (
              <div key={list.id} className="min-w-0">
                {/* Só a fileira de pôsteres abre a lista */}
                <Link href={`/u/${list.owner.username}/list/${list.id}`} className="group block">
                  <ListStrip posters={list.posters} />
                </Link>
                <p className="mt-2 truncate font-semibold">{list.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <Link href={`/u/${list.owner.username}`} className="flex min-w-0 items-center gap-1.5 font-semibold hover:text-fg">
                    <Avatar profile={list.owner} size={18} />
                    <span className="truncate">{list.owner.display_name || list.owner.username}</span>
                  </Link>
                  <span className="shrink-0">{t.lists.count(list.count)}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
                    </svg>
                    {list.comments}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />
                    </svg>
                    {list.likes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {reviews.length > 0 && (
        <Section title={t.home.popularReviews}>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="flex gap-4">
                <Link href={itemHref(r.items)} className="group w-16 shrink-0 self-start sm:w-20">
                  <PosterImage
                    url={r.items.poster_url}
                    title={itemTitle(r.items, locale)}
                    watched={!!states.get(r.item_id)?.watched}
                  />
                </Link>
                <div className="min-w-0 flex-1 space-y-1">
                  <Link href={itemHref(r.items)} className="block truncate font-semibold hover:text-accent">
                    {itemTitle(r.items, locale)} <span className="font-normal text-muted">{r.items.year}</span>
                  </Link>
                  <Link
                    href={`/u/${r.profiles.username}`}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-fg"
                  >
                    <Avatar profile={r.profiles} size={18} />
                    <span className="truncate">{r.profiles.display_name || r.profiles.username}</span>
                    <StarsDisplay rating={r.rating} valueLang={dictionaries[locale].htmlLang} />
                    {r.liked && <span className="text-like">♥</span>}
                  </Link>
                  {r.review && <TranslatableText text={r.review} className="line-clamp-4 text-sm whitespace-pre-line text-fg/85" />}
                  <ReviewAttachments attachments={r.attachments} />
                  <ReviewComments
                    entryId={r.id}
                    reviewOwnerId={r.user_id}
                    viewerId={viewer?.id ?? null}
                    initialCount={commentCounts.get(r.id) ?? 0}
                    actions={
                      <ReviewLike
                        entryId={r.id}
                        viewerId={viewer?.id ?? null}
                        initialLiked={reviewLikes.mine.has(r.id)}
                        initialCount={reviewLikes.counts.get(r.id) ?? 0}
                        label={t.movie.like}
                      />
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// Uma pasta: populares da semana (anime: a temporada), a prateleira pessoal e uma amostra de tudo.
async function FolderTab({ kind, viewer, t, locale }: { kind: MediaKind; viewer: Profile | null; t: Dictionary; locale: Locale }) {
  // Em andamento (assistindo, lendo, jogando) onde faz sentido; filmes e músicas: a watchlist.
  const shelfStatus = kind === "movie" || kind === "music" ? "watchlist" : "watching";
  const [popular, shelf, sample] = await Promise.all([
    getPopularItems(kind),
    viewer ? getViewerShelf(viewer.id, kind, shelfStatus) : ([] as Item[]),
    catalogSample(kind, locale, !!viewer?.show_adult),
  ]);
  const states = await getViewerStates(viewer?.id ?? "", viewer ? [...popular, ...shelf].map((i) => i.id) : []);
  const viewerFor = (itemId: string) => (viewer ? { id: viewer.id, state: states.get(itemId) ?? null } : null);
  const browse = `/browse/${BROWSE_PATHS[kind]}`;
  const shelfTitle =
    shelfStatus === "watchlist"
      ? t.home.yourWatchlist
      : kind === "manga" || kind === "book"
        ? t.home.readingNow
        : kind === "game"
          ? t.home.playingNow
          : t.home.watchingNow;

  return (
    <div className="space-y-12">
      <Section
        // Animes: os da temporada atual, e o "Ver tudo" abre a página da temporada.
        title={kind === "anime" ? t.anime.thisSeason : t.home.popular(t.folders[kind])}
        more={{ href: kind === "anime" ? "/anime/season" : `${browse}?sort=week`, label: t.profile.all }}
      >
        <ItemRow items={popular} kind={kind} locale={locale} viewerFor={viewerFor} />
      </Section>

      {/* Prateleira pessoal: aparece sempre para quem está logado; vazia, um aviso no lugar dos pôsteres */}
      {viewer && (
        <Section
          title={shelfTitle}
          more={
            shelf.length
              ? { href: `/u/${viewer.username}/${BROWSE_PATHS[kind]}?tab=${shelfStatus}`, label: t.profile.all }
              : undefined
          }
        >
          {shelf.length ? (
            <ItemRow items={shelf} kind={kind} locale={locale} viewerFor={viewerFor} />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              {shelfStatus === "watchlist" ? t.home.emptyWatchlist : t.home.emptyInProgress}
            </p>
          )}
        </Section>
      )}

      <Section title={t.folders.allOf(t.folders[kind])} more={{ href: browse, label: t.profile.all }}>
        {sample.length ? (
          <ExternalPosters kind={kind as "movie" | "series" | "anime" | "manga" | "book" | "game"} list={sample} viewer={viewer} layout="row" />
        ) : (
          <ItemRow items={[]} kind={kind} locale={locale} viewerFor={viewerFor} />
        )}
      </Section>
    </div>
  );
}

// Amostra de "Todos os ...": os mais bem avaliados (filmes e séries, TMDB; livros, Open Library), os mais
// populares de sempre (animes e mangás, AniList) ou mais jogados (jogos, Steam). Músicas ainda sem fonte.
async function catalogSample(kind: MediaKind, locale: Locale, showAdult: boolean): Promise<ExternalPoster[]> {
  if (kind === "movie" || kind === "series") {
    const { movies } = await browseMovies({}, "top", 1, {
      language: tmdbLanguage(locale),
      showAdult,
      type: kind === "series" ? "tv" : "movie",
    });
    return movies.slice(0, 6).map((m) => ({ id: m.id, title: m.title, year: releaseYear(m), poster: tmdbImage(m.poster_path, "w342"), rating: m.vote_average ? m.vote_average / 2 : null, unreleased: !!m.release_date && m.release_date > new Date().toISOString().slice(0, 10) }));
  }
  if (kind === "anime" || kind === "manga") {
    return (await browseCatalog({ kind, page: 1, perPage: 6, sort: "popular", showAdult })).list;
  }
  if (kind === "book") {
    const { list } = await browseBooks({ page: 1, perPage: 6, sort: "top" });
    return list.map((b) => ({ id: b.id, title: b.title, year: b.year, poster: b.cover, rating: b.rating }));
  }
  if (kind === "game") return (await browseGames({ page: 1, perPage: 6, sort: "popular" })).list;
  return [];
}

function ItemRow({
  items,
  kind,
  locale,
  viewerFor,
}: {
  items: Item[];
  kind: MediaKind;
  locale: Locale;
  viewerFor: (itemId: string) => { id: string; state: ViewerItemState | null } | null;
}) {
  return (
    <Row>
      {items.map((item, i) => (
        <Poster key={item.id} item={item} locale={locale} eager={i < 6} viewer={viewerFor(item.id)} />
      ))}
      {Array.from({ length: Math.max(0, 6 - items.length) }, (_, i) => (
        <div
          key={`empty-${i}`}
          aria-hidden
          className="grid aspect-[2/3] place-items-center rounded-md border border-border bg-surface-2 text-muted/40"
        >
          <FolderIcon kind={kind} className="size-8" />
        </div>
      ))}
    </Row>
  );
}

function Section({
  title,
  more,
  children,
}: {
  title: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">{title}</h2>
        {more && (
          <Link href={more.href} className="text-[11px] tracking-wider text-muted uppercase hover:text-accent">
            {more.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// Fileira horizontal de 6 itens (3 por linha no celular).
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">{children}</div>;
}

// Capa de lista da Home: até 5 pôsteres em fileira, um por cima do outro, o primeiro na frente.
function ListStrip({ posters }: { posters: (string | null)[] }) {
  const shown = posters.slice(0, 5);
  return (
    <div className="relative aspect-[20/9] overflow-hidden rounded-md">
      {shown.map((url, i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-[30%] overflow-hidden rounded-md border border-border bg-surface-2 shadow-[4px_0_12px_rgba(0,0,0,0.6)] transition group-hover:border-fg"
          style={{ insetInlineStart: `${i * 17.5}%`, zIndex: 5 - i }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element -- pôster da lista (CDN)
            <img src={url} alt="" loading="lazy" className="size-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
