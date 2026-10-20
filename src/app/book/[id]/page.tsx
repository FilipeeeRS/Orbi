import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookByRouteId } from "@/lib/catalog";
import { getBook } from "@/lib/openlibrary";
import { getDict, getViewer } from "@/lib/session";
import { getItemStats, withSourceStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { MovieInfo } from "../../movie/[id]/movie-info";
import { EntryEditor } from "../../movie/[id]/entry-editor";
import { ExternalLink, ItemDetail, ItemStats, ReviewsSection, SignInToLog } from "@/components/item-detail";

export async function generateMetadata({ params }: PageProps<"/book/[id]">): Promise<Metadata> {
  const item = await getBookByRouteId((await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

// Livro (dados da Open Library): mesma página dos filmes, com autores, páginas e assuntos.
export default function BookPage(props: PageProps<"/book/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <BookContent {...props} />
    </Suspense>
  );
}

async function BookContent({ params }: PageProps<"/book/[id]">) {
  const { id } = await params;
  const [item, viewer, { t, locale }] = await Promise.all([getBookByRouteId(id), getViewer(), getDict()]);
  if (!item) notFound();

  const supabase = await createClient();
  const [stats, book, entry] = await Promise.all([
    getItemStats(item.id),
    getBook(id),
    viewer
      ? supabase
          .from("entries")
          .select("*")
          .eq("user_id", viewer.id)
          .eq("item_id", item.id)
          .maybeSingle()
          .then((r) => r.data as Entry | null)
      : null,
  ]);

  // Números da fonte somados aos do Orbi (Open Library: "já li" e "quero ler"); a nota mistura as duas.
  const shown = withSourceStats(stats, item, { watched: book?.alreadyRead, watchlist: book?.wantToRead });

  return (
    <ItemDetail
      item={item}
      title={itemTitle(item, locale)}
      overview={book?.description ?? itemOverview(item, locale)}
      posterUrl={item.poster_url}
      backdropUrl={null}
      hideAdult={false}
      stats={shown}
      t={t}
      editor={
        viewer ? (
          <EntryEditor itemId={item.id} userId={viewer.id} initial={entry} series progress="chapter" />
        ) : (
          <SignInToLog href={`/book/${id}`} label={t.book.signInToLog} />
        )
      }
      details={
        book && (
          <div className="space-y-4 pt-4">
            <MovieInfo
              info={{
                cast: [],
                crew: book.authors.length ? [{ role: "original", people: book.authors.map((name) => ({ name })) }] : [],
                details: [
                  { label: t.book.authors, values: book.authors.map((name) => ({ name, href: `/search?q=${encodeURIComponent(name)}&type=book` })) },
                  { label: t.book.publishers, values: book.publishers.map((name) => ({ name })) },
                ].filter((row) => row.values.length),
                genres: book.subjects.map((s) => ({ name: s })),
                releases: [],
                watch: null,
              }}
            />
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {book.pages && <span>{t.book.pages(book.pages)}</span>}
              {book.year && <span>{t.book.published(book.year)}</span>}
              <span>{t.info.moreAt}</span>
              <ExternalLink href={`https://openlibrary.org/works/${id}`}>Open Library</ExternalLink>
            </p>
          </div>
        )
      }
      side={<ItemStats stats={shown} t={t} locale={locale} />}
    >
      <ReviewsSection itemId={item.id} viewerId={viewer?.id ?? null} t={t} locale={locale} />
    </ItemDetail>
  );
}
