import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/header";
import { PosterImage } from "@/components/poster";
import { StarsDisplay } from "@/components/stars";
import { getMovieByRouteId } from "@/lib/catalog";
import { getDict, getViewer } from "@/lib/session";
import { getItemReviews } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { EntryEditor } from "./entry-editor";

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const item = await getMovieByRouteId((await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

export default function MoviePage(props: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <MoviePageContent {...props} />
    </Suspense>
  );
}

async function MoviePageContent({ params }: PageProps<"/movie/[id]">) {
  const { id } = await params;
  const [item, viewer, { t, locale }] = await Promise.all([getMovieByRouteId(id), getViewer(), getDict()]);
  if (!item) notFound();

  const supabase = await createClient();
  const [reviews, entry] = await Promise.all([
    getItemReviews(item.id),
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

  const title = itemTitle(item, locale);
  const overview = itemOverview(item, locale);

  return (
    <div className="space-y-10">
      {item.backdrop_url && (
        <div className="relative -mx-4 -mt-6 h-48 overflow-hidden sm:-mt-8 sm:h-72 md:rounded-b-2xl">
          <Image src={item.backdrop_url} alt="" fill className="object-cover" loading="eager" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        </div>
      )}

      <div className={`relative grid items-start gap-6 sm:grid-cols-[1fr_220px] sm:gap-10 ${item.backdrop_url ? "-mt-16 sm:-mt-20" : ""}`}>
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              {title} {item.year && <span className="font-normal text-muted">{item.year}</span>}
            </h1>
            {item.original_title && item.original_title !== title && (
              <p className="text-sm text-muted italic">{item.original_title}</p>
            )}
            {item.tmdb_rating !== null && (
              <p className="mt-1 text-sm text-muted">
                <span className="text-star">★</span> {item.tmdb_rating.toFixed(1)}
                <span className="text-xs"> / 10 · TMDB</span>
              </p>
            )}
          </div>
          {overview && <p className="max-w-2xl leading-relaxed text-muted">{overview}</p>}

          {viewer ? (
            <EntryEditor itemId={item.id} userId={viewer.id} initial={entry} />
          ) : (
            <Link
              href={`/login?next=/movie/${id}`}
              className="inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
            >
              {t.movie.signInToLog}
            </Link>
          )}
        </div>

        <div className="order-first mx-auto w-40 shadow-2xl sm:order-none sm:w-full">
          <PosterImage url={item.poster_url} title={title} eager />
        </div>
      </div>

      <section>
        <h2 className="mb-3 border-b border-border pb-2 text-xs font-semibold tracking-widest text-muted uppercase">
          {t.movie.reviews}
        </h2>
        {reviews.length ? (
          <ul className="divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="flex gap-3 py-4">
                <Link href={`/u/${r.profiles.username}`} className="shrink-0">
                  <Avatar profile={r.profiles} size={36} />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Link href={`/u/${r.profiles.username}`} className="font-semibold hover:text-accent">
                      {r.profiles.display_name || r.profiles.username}
                    </Link>
                    <StarsDisplay rating={r.rating} />
                    {r.liked && <span className="text-like">♥</span>}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-line">{r.review}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t.movie.noReviews}</p>
        )}
      </section>
    </div>
  );
}
