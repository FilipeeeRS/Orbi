import Link from "next/link";
import { Avatar } from "@/components/header";
import { FolderIcon } from "@/components/folder-icon";
import { Poster, PosterImage } from "@/components/poster";
import { StarsDisplay } from "@/components/stars";
import { getFriendsActivity, getKindOrderForViewer, getPopularItems, getPopularReviews } from "@/lib/home";
import { getReviewCommentCounts, getReviewLikes, getViewerStates } from "@/lib/queries";
import { ReviewLike } from "@/components/review-like";
import { ReviewAttachments } from "@/components/review-attachments";
import { TranslatableText } from "@/components/translatable-text";
import { ReviewComments } from "@/components/review-comments";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { itemHref, itemTitle, type MediaKind, type Profile } from "@/lib/types";

const KINDS: MediaKind[] = ["movie", "series", "music", "game", "book"];
// "Ver tudo" de cada fileira abre o catálogo da pasta já ordenado por "Populares esta semana".
const BROWSE_PATHS: Record<MediaKind, string> = { movie: "movies", series: "series", music: "music", game: "games", book: "books" };

// Tela inicial: boas-vindas, amigos, populares da semana e reviews.
// Visitante (viewer null) vê só populares e reviews; marcar ou curtir leva para o login.
// "Listas populares" entra quando existirem listas personalizadas (watchlist é pessoal, não conta).
export async function HomeDashboard({ viewer, t, locale }: { viewer: Profile | null; t: Dictionary; locale: Locale }) {
  const [friends, popularByKind, reviews, kindOrder] = await Promise.all([
    viewer ? getFriendsActivity(viewer.id) : [],
    Promise.all(KINDS.map(async (kind) => ({ kind, items: await getPopularItems(kind) }))),
    getPopularReviews(6),
    viewer ? getKindOrderForViewer(viewer.id, KINDS) : KINDS,
  ]);
  // Todas as pastas aparecem; as que ainda não têm itens mostram capas vazias.
  // e a ordem das pastas segue o que o usuário mais adicionou recentemente.
  const popular = kindOrder.map((kind) => popularByKind.find((p) => p.kind === kind)!);

  const states = await getViewerStates(viewer?.id ?? "", viewer ? [
    ...friends.map((e) => e.item_id),
    ...popular.flatMap((p) => p.items.map((i) => i.id)),
    ...reviews.map((r) => r.item_id),
  ] : []);
  const viewerFor = (itemId: string) => (viewer ? { id: viewer.id, state: states.get(itemId) ?? null } : null);
  const [reviewLikes, commentCounts] = await Promise.all([
    getReviewLikes(reviews.map((r) => r.id), viewer?.id ?? null),
    getReviewCommentCounts(reviews.map((r) => r.id)),
  ]);

  return (
    <div className="space-y-12">
      {viewer ? (
        <header>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t.home.welcome(viewer.display_name || viewer.username)}
          </h1>
          <p className="mt-1 text-muted">{t.home.welcomeSub}</p>
        </header>
      ) : (
        <header>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t.home.welcomeSub}</h1>
        </header>
      )}

      {friends.length > 0 && (
        <Section title={t.home.newFromFriends}>
          <Row>
            {friends.map((e) => (
              <div key={e.id} className="space-y-1.5">
                <Poster item={e.items} locale={locale} showMeta={false} viewer={viewerFor(e.item_id)} />
                <Link
                  href={`/u/${e.profiles.username}`}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-fg"
                  title={e.profiles.display_name || e.profiles.username}
                >
                  <Avatar profile={e.profiles} size={18} />
                  <StarsDisplay rating={e.rating} />
                  {e.liked && <span className="text-like">♥</span>}
                </Link>
              </div>
            ))}
          </Row>
        </Section>
      )}

      {popular.map(({ kind, items }) => (
        <Section
          key={kind}
          title={t.home.popular(t.folders[kind])}
          more={{ href: `/browse/${BROWSE_PATHS[kind]}`, label: t.profile.all }}
        >
          <Row>
            {items.map((item, i) => (
              <Poster key={item.id} item={item} locale={locale} showMeta={false} eager={i < 6} viewer={viewerFor(item.id)} />
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
        </Section>
      ))}

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
