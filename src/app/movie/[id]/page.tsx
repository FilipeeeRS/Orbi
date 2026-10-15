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
import { getItemReviews, getItemStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
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
  const [reviews, stats, entry] = await Promise.all([
    getItemReviews(item.id),
    getItemStats(item.id),
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
    <div className="mx-auto max-w-5xl space-y-10">
      {item.backdrop_url && (
        // Backdrop mais estreito, centralizado e com as bordas laterais esmaecidas
        <div className="relative -mt-6 h-48 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:-mt-8 sm:h-80">
          <Image src={item.backdrop_url} alt="" fill className="object-cover object-[center_30%]" loading="eager" sizes="(max-width: 1024px) 100vw, 1024px" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        </div>
      )}

      <div
        className={`relative grid items-start gap-8 sm:grid-cols-[minmax(0,1fr)_220px] ${item.backdrop_url ? "-mt-20 sm:-mt-28" : ""}`}
      >
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              {title}{" "}
              {item.year && <span className="font-sans text-xl font-normal tracking-normal text-muted">{item.year}</span>}
            </h1>
            {item.original_title && item.original_title !== title && (
              <p className="text-sm text-muted italic">{item.original_title}</p>
            )}
            {item.tmdb_rating !== null && (
              <p className="mt-1 text-sm text-muted">
                <span className="text-star">★</span> {item.tmdb_rating.toFixed(1)}
                <span className="text-xs"> / 10 {t.movie.onSource("TMDB")}</span>
              </p>
            )}
          </div>
          <OrbiRating average={stats.average} count={stats.ratings} t={t} />
          </div>
          {overview && <p className="leading-relaxed text-muted">{overview}</p>}

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

        <div className="order-first mx-auto w-40 space-y-3 sm:order-none sm:w-full">
          <div className="shadow-2xl">
            <PosterImage url={item.poster_url} title={title} eager />
          </div>
          <ItemStats stats={stats} t={t} locale={locale} />
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

// Média das notas dadas pelos usuários do Orbi, em destaque ao lado do título.
function OrbiRating({ average, count, t }: { average: number | null; count: number; t: Dictionary }) {
  return (
    <div className="shrink-0 text-end" title={`${t.profile.average}: ${count} ${t.profile.ratings.toLowerCase()}`}>
      <p className="flex items-center justify-end gap-1">
        <span className="font-display text-4xl leading-none font-extrabold tabular-nums">
          {average === null ? "–" : average.toFixed(1)}
        </span>
        <svg viewBox="0 0 24 24" className="size-7 text-star" fill="currentColor" aria-hidden>
          <path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" />
        </svg>
      </p>
      <p className="mt-1 text-[10px] tracking-widest text-muted uppercase">
        {t.movie.onSource("Orbi")}
      </p>
    </div>
  );
}

// Linha de números abaixo do pôster, no estilo do Letterboxd: ícone + número, detalhe no tooltip.
function ItemStats({
  stats,
  t,
  locale,
}: {
  stats: Awaited<ReturnType<typeof getItemStats>>;
  t: Dictionary;
  locale: Locale;
}) {
  const lang = dictionaries[locale].htmlLang;
  const compact = new Intl.NumberFormat(lang, { notation: "compact" });
  const items = [
    {
      label: t.movies.tabs.watched,
      value: stats.watched,
      color: "text-ok",
      icon: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
    },
    {
      label: t.movies.tabs.liked,
      value: stats.likes,
      color: "text-like",
      icon: <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" />,
    },
    {
      label: t.movies.tabs.watchlist,
      value: stats.watchlist,
      color: "text-accent",
      stroke: true,
      icon: <path d="M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />,
    },
  ];
  return (
    <ul className="flex items-center justify-center gap-4 text-sm">
      {items.map((s) => (
        <li key={s.label} title={`${s.label}: ${s.value.toLocaleString(lang)}`} className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            className={`size-4 ${s.color}`}
            fill={"stroke" in s ? "none" : "currentColor"}
            fillRule="evenodd"
            stroke={"stroke" in s ? "currentColor" : "none"}
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden
          >
            {s.icon}
          </svg>
          <span className="tabular-nums text-muted">{compact.format(s.value)}</span>
        </li>
      ))}
    </ul>
  );
}
