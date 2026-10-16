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
import { getItemReviews, getItemStats, getReviewCommentCounts, getReviewLikes } from "@/lib/queries";
import { ReviewLike } from "@/components/review-like";
import { ReviewAttachments } from "@/components/review-attachments";
import { TranslatableText } from "@/components/translatable-text";
import { ReviewComments } from "@/components/review-comments";
import { getMovieInfo, tmdbLanguage, CREW_ROLES, WATCH_KINDS, type MovieInfo as MovieInfoData } from "@/lib/tmdb";
import { MovieInfo, type MovieInfoView } from "./movie-info";
import { createClient } from "@/lib/supabase/server";
import { itemOverview, itemTitle, type Entry } from "@/lib/types";
import { dictionaries, TMDB_LANGUAGES, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { EntryEditor } from "./entry-editor";
import { TrailerButton } from "./trailer-button";
import { ArtEditor } from "./art-editor";
import { getArt } from "@/lib/art";

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
  const [reviews, stats, info, entry, art] = await Promise.all([
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
    // Pôster/fundo que quem está vendo escolheu para este filme
    viewer ? getArt(viewer.id, [item.id]).then((a) => a.get(item.id)) : undefined,
  ]);
  const posterUrl = art?.poster ?? item.poster_url;
  const backdropUrl = art?.backdrop ?? item.backdrop_url;

  const [reviewLikes, commentCounts] = await Promise.all([
    getReviewLikes(reviews.map((r) => r.id), viewer?.id ?? null),
    getReviewCommentCounts(reviews.map((r) => r.id)),
  ]);
  const title = itemTitle(item, locale);
  const overview = itemOverview(item, locale);
  // Filme 18 anos para quem não ativou o conteúdo +18: imagens borradas e aviso.
  const hideAdult = !!item.is_adult_rated && !viewer?.show_adult;
  const hasOriginal = !!item.original_title && item.original_title !== title;
  const tmdbRating =
    item.tmdb_rating != null ? (
      <span>
        <span className="text-star">★</span> {item.tmdb_rating.toFixed(1)}
        <span className="text-xs"> / 10 {t.movie.onSource("TMDB")}</span>
      </span>
    ) : null;

  return (
    <div className="mx-auto max-w-[58rem] space-y-10">
      {/* O espaço do fundo existe sempre; sem imagem ele só fica vazio (igual ao perfil) */}
      <div className="backdrop-fade relative -mt-6 ml-[calc(50%-min(50vw,650px))] h-70 w-[min(100vw,1300px)] overflow-hidden sm:-mt-8 sm:h-120">
        {backdropUrl && (
          <Image
            src={backdropUrl}
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
          {/* Grade de 2 colunas: título alinhado com a nota do Orbi; embaixo, TMDB + título original com o "no Orbi" */}
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
            {/* Nota do TMDB e, à direita dela, o título original (quando é diferente) */}
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
              {tmdbRating}
              {hasOriginal && <span className="italic">{item.original_title}</span>}
            </p>
            <p className="text-end text-xs text-muted">{t.movie.onSource("Orbi")}</p>
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
              <MovieInfo info={toView(info, t, locale)} />
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <Certification certifications={info.certifications ?? {}} locale={locale} label={t.info.ageRating} />
                {info.runtime && (
                  <span>
                    {info.runtime} min <span className="text-muted/80">({hoursAndMinutes(info.runtime)})</span>
                  </span>
                )}
                <span>{t.info.moreAt}</span>
                {info.imdbId && <ExternalLink href={`https://www.imdb.com/title/${info.imdbId}/`}>IMDb</ExternalLink>}
                <ExternalLink href={`https://www.themoviedb.org/movie/${item.external_id}`}>TMDB</ExternalLink>
              </p>
            </div>
          )}
        </div>

        <div className="order-first mx-auto w-40 space-y-3 sm:order-none sm:w-full">
          <div className={`shadow-2xl ${hideAdult ? "overflow-hidden rounded-md [&_img]:scale-110 [&_img]:blur-xl" : ""}`}>
            <PosterImage url={posterUrl} title={title} eager />
          </div>
          <div className="flex items-center justify-between gap-3">
            <ItemStats stats={stats} t={t} locale={locale} />
            {info?.trailer && <TrailerButton videoId={info.trailer} label={t.movie.trailer} />}
          </div>
          {/* Trocar pôster/fundo: só em filmes que a pessoa já viu */}
          {viewer && item.source === "tmdb" && entry?.status === "watched" && (
            <div className="-mt-1 flex justify-end">
              <ArtEditor
                itemId={item.id}
                currentPoster={posterUrl}
                currentBackdrop={backdropUrl}
                labels={{
                  edit: t.movie.artEdit,
                  poster: t.movie.artPoster,
                  backdrop: t.movie.artBackdrop,
                  reset: t.movie.artReset,
                  empty: t.movie.artEmpty,
                  hint: t.movie.artHint,
                }}
              />
            </div>
          )}
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
                  {r.review && <TranslatableText text={r.review} className="mt-1 text-sm whitespace-pre-line" />}
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
    <ul className="flex items-center gap-4 text-sm">
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

// 164 → "2h 44min"; 90 → "1h 30min"; 45 → "45min"
function hoursAndMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m}min`;
}

// Classificação indicativa do país do idioma escolhido (pt → BR, en → US...); sem ela, a dos EUA.
function Certification({ certifications, locale, label }: { certifications: Record<string, string>; locale: Locale; label: string }) {
  const region = TMDB_LANGUAGES[locale].split("-")[1];
  const country = certifications[region] ? region : certifications.US ? "US" : null;
  if (!country) return null;
  const value = certifications[country];
  return (
    <span
      title={`${label} (${country})`}
      className="rounded border border-muted/60 px-1.5 py-px text-[10px] leading-4 font-bold tracking-wider text-fg/80"
    >
      {value}
      {country !== region && <span className="ms-1 font-normal text-muted">{country}</span>}
    </span>
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
// Onde assistir no país do idioma escolhido (pt → BR, en → US...).
function watchView(info: MovieInfoData, locale: Locale, country: (code: string) => string): MovieInfoView["watch"] {
  if (!Object.keys(info.watch ?? {}).length) return null;
  const region = TMDB_LANGUAGES[locale].split("-")[1];
  const options = info.watch[region];
  return {
    country: country(region),
    link: options?.link ?? null,
    groups: WATCH_KINDS.flatMap((kind) => (options?.[kind]?.length ? [{ kind, providers: options[kind]! }] : [])),
  };
}

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
    watch: watchView(info, locale, country),
  };
}
