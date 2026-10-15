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
import { getItemReviews, getItemStats, getReviewLikes } from "@/lib/queries";
import { ReviewLike } from "@/components/review-like";
import { getMovieInfo, tmdbLanguage, CREW_ROLES, type MovieInfo as MovieInfoData } from "@/lib/tmdb";
import { MovieInfo, type MovieInfoView } from "./movie-info";
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
  const [reviews, stats, info, entry] = await Promise.all([
    getItemReviews(item.id),
    getItemStats(item.id),
    item.source === "tmdb" && item.external_id ? getMovieInfo(item.external_id, tmdbLanguage(locale)) : null,
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

  const reviewLikes = await getReviewLikes(reviews.map((r) => r.id), viewer?.id ?? null);
  const title = itemTitle(item, locale);
  const overview = itemOverview(item, locale);
  // Filme 18 anos para quem não ativou o conteúdo +18: imagens borradas e aviso.
  const hideAdult = !!item.is_adult_rated && !viewer?.show_adult;

  return (
    <div className="mx-auto max-w-[58rem] space-y-10">
      {/* O espaço do fundo existe sempre; sem imagem ele só fica vazio (igual ao perfil) */}
      <div className="backdrop-fade relative left-1/2 -mt-6 h-56 w-screen max-w-[1300px] -translate-x-1/2 overflow-hidden sm:-mt-8 sm:h-96">
        {item.backdrop_url && (
          <Image
            src={item.backdrop_url}
            alt=""
            fill
            className={`object-cover object-[center_30%] ${hideAdult ? "scale-110 blur-2xl" : ""}`}
            loading="eager"
            sizes="(max-width: 1300px) 100vw, 1300px"
          />
        )}
      </div>

      <div
        className={`relative grid items-start gap-8 sm:grid-cols-[minmax(0,1fr)_220px] -mt-24 sm:-mt-40`}
      >
        <div className="space-y-5">
          {/* Grade de 2 colunas: título alinhado com a nota do Orbi, e a linha do TMDB com o "no Orbi" */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
              {title}{" "}
              {item.year && <span className="font-sans text-xl font-normal tracking-normal text-muted">{item.year}</span>}
            </h1>
            <p
              className="flex items-baseline justify-end gap-1"
              title={`${t.profile.average}: ${stats.ratings} ${t.profile.ratings.toLowerCase()}`}
            >
              <span className="font-display text-3xl leading-tight font-extrabold tabular-nums sm:text-4xl">
                {stats.average === null ? "–" : stats.average.toFixed(1)}
              </span>
              <svg viewBox="0 0 24 24" className="size-6 self-center text-star sm:size-7" fill="currentColor" aria-hidden>
                <path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" />
              </svg>
            </p>
            <p className="text-sm text-muted">
              {item.tmdb_rating != null && (
                <>
                  <span className="text-star">★</span> {item.tmdb_rating.toFixed(1)}
                  <span className="text-xs"> / 10 {t.movie.onSource("TMDB")}</span>
                </>
              )}
            </p>
            <p className="text-end text-xs text-muted">{t.movie.onSource("Orbi")}</p>
            {item.original_title && item.original_title !== title && (
              <p className="col-span-2 text-sm text-muted italic">{item.original_title}</p>
            )}
          </div>
          {hideAdult && (
            <p className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
              <span className="rounded border border-danger px-1.5 text-[11px] font-bold text-danger">18</span>
              <Link href="/settings" className="hover:text-fg hover:underline">
                {t.movie.adultNotice}
              </Link>
            </p>
          )}
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

          {info && (
            <div className="space-y-4 pt-4">
              <MovieInfo info={toView(info, t, locale)} labels={t.info} />
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {info.runtime && <span>{info.runtime} min</span>}
                <span>{t.info.moreAt}</span>
                {info.imdbId && <ExternalLink href={`https://www.imdb.com/title/${info.imdbId}/`}>IMDb</ExternalLink>}
                <ExternalLink href={`https://www.themoviedb.org/movie/${item.external_id}`}>TMDB</ExternalLink>
              </p>
            </div>
          )}
        </div>

        <div className="order-first mx-auto w-40 space-y-3 sm:order-none sm:w-full">
          <div className={`shadow-2xl ${hideAdult ? "overflow-hidden rounded-md [&_img]:scale-110 [&_img]:blur-xl" : ""}`}>
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
              <li key={r.id} className="flex items-start gap-3 py-4">
                <Link href={`/u/${r.profiles.username}`} className="shrink-0">
                  <Avatar profile={r.profiles} size={36} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Link href={`/u/${r.profiles.username}`} className="font-semibold hover:text-accent">
                      {r.profiles.display_name || r.profiles.username}
                    </Link>
                    <StarsDisplay rating={r.rating} valueLang={dictionaries[locale].htmlLang} />
                    {r.liked && <span className="text-like">♥</span>}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-line">{r.review}</p>
                </div>
                <ReviewLike
                  entryId={r.id}
                  viewerId={viewer?.id ?? null}
                  initialLiked={reviewLikes.mine.has(r.id)}
                  initialCount={reviewLikes.counts.get(r.id) ?? 0}
                  label={t.movie.like}
                />
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
      stroke: true,
      icon: <path d="M5 12.5l4.5 4.5L19 7.5" />,
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
      color: "text-fg",
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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase hover:border-accent hover:text-fg"
    >
      {children}
    </a>
  );
}

// Formata a ficha do TMDB no idioma do usuário (nomes de países/idiomas e datas).
function toView(info: MovieInfoData, t: Dictionary, locale: Locale): MovieInfoView {
  const lang = dictionaries[locale].htmlLang;
  const regionName = new Intl.DisplayNames([lang], { type: "region" });
  const languageName = new Intl.DisplayNames([lang], { type: "language" });
  const safe = (fn: () => string | undefined, fallback: string) => {
    try {
      return fn() ?? fallback;
    } catch {
      return fallback;
    }
  };
  const country = (code: string) => safe(() => regionName.of(code), code);
  const date = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang, { day: "2-digit", month: "short", year: "numeric" });
  };

  // Cada nome leva para a busca já preenchida (pessoa, gênero, estúdio ou país).
  const browse = (key: string, value: string | number, name: string) =>
    `/search?${new URLSearchParams({ [key]: String(value), q: name })}`;
  const person = (p: { id: number; name: string }) => ({ name: p.name, href: browse("person", p.id, p.name) });

  return {
    cast: info.cast.map((p) => ({ ...person(p), character: p.character })),
    crew: CREW_ROLES.filter((role) => info.crew[role]?.length).map((role) => ({
      role,
      people: info.crew[role]!.map(person),
    })),
    details: [
      { label: t.info.studios, values: info.studios.map((c) => ({ name: c.name, href: browse("company", c.id, c.name) })) },
      {
        label: t.info.countries,
        values: info.countries.map((code) => ({ name: country(code), href: browse("country", code, country(code)) })),
      },
      {
        label: t.info.language,
        values: info.originalLanguage
          ? [{ name: safe(() => languageName.of(info.originalLanguage!), info.originalLanguage) }]
          : [],
      },
    ].filter((row) => row.values.length),
    genres: info.genres.map((g) => ({ name: g.name, href: browse("genre", g.id, g.name) })),
    releases: info.releases.map((r) => ({ country: country(r.country), date: date(r.date), certification: r.certification })),
  };
}
