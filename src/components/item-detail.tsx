import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/header";
import { PosterImage } from "@/components/poster";
import { StarsDisplay } from "@/components/stars";
import { ReviewLike } from "@/components/review-like";
import { ReviewAttachments } from "@/components/review-attachments";
import { TranslatableText } from "@/components/translatable-text";
import { ReviewComments } from "@/components/review-comments";
import { getItemReviews, getItemStats, getReviewCommentCounts, getReviewLikes } from "@/lib/queries";
import { getFriendsOnItem } from "@/lib/home";
import { CREW_ROLES, WATCH_KINDS, type MovieInfo as MovieInfoData } from "@/lib/tmdb";
import type { MovieInfoView } from "@/app/movie/[id]/movie-info";
import { dictionaries, TMDB_LANGUAGES, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import type { Item } from "@/lib/types";

// Página de uma obra (filme, série, temporada): fundo, título com as notas, editor, ficha, pôster e reviews.
// Cada tipo preenche os espaços (editor, ficha, seções extras); o esqueleto é o mesmo.

export type ItemStatsData = Awaited<ReturnType<typeof getItemStats>>;

export function ItemDetail({
  item,
  title,
  overview,
  posterUrl,
  backdropUrl,
  hideAdult,
  stats,
  t,
  above,
  sourceLine,
  editor,
  details,
  side,
  children,
}: {
  item: Item;
  title: string;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  hideAdult: boolean;
  stats: ItemStatsData;
  t: Dictionary;
  above?: React.ReactNode; // ex.: link para a série acima do título da temporada
  sourceLine?: React.ReactNode; // no lugar da nota da fonte embaixo do título (jogos: "Muito positivas na Steam")
  editor: React.ReactNode;
  details?: React.ReactNode;
  side?: React.ReactNode; // abaixo dos números do pôster (trailer, trocar arte)
  children?: React.ReactNode; // seções entre a ficha e as reviews (temporadas, episódios)
}) {
  const hasOriginal = !!item.original_title && item.original_title !== title;
  // Nota original da fonte, como referência embaixo do título (a nota grande já é a mistura com o Orbi).
  const SOURCE_LABEL: Record<string, string> = { tmdb: "TMDB", anilist: "AniList", openlibrary: "Open Library", steam: "Metacritic" };
  const sourceRating =
    item.tmdb_rating != null && item.tmdb_rating > 0 && SOURCE_LABEL[item.source] ? (
      <span>
        <span className="text-star">★</span> {item.tmdb_rating.toFixed(1)}
        <span className="text-xs"> / 10 {t.movie.onSource(SOURCE_LABEL[item.source])}</span>
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

      <div className={`relative grid grid-cols-[minmax(0,1fr)] items-start gap-8 sm:grid-cols-[minmax(0,1fr)_220px] -mt-24 sm:-mt-40`}>
        <div className="space-y-5">
          {above}
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
            {/* Nota da fonte e, à direita dela, o título original (quando é diferente) */}
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
              {sourceLine ?? sourceRating}
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

          {editor}
          {details}
        </div>

        <div className="order-first mx-auto w-40 space-y-3 sm:order-none sm:w-full">
          <div className={`shadow-2xl ${hideAdult ? "overflow-hidden rounded-md [&_img]:scale-110 [&_img]:blur-xl" : ""}`}>
            <PosterImage url={posterUrl} title={title} eager />
          </div>
          {side}
        </div>
      </div>

      {children}
    </div>
  );
}

export function SignInToLog({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={`/login?next=${href}`}
      className="inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
    >
      {label}
    </Link>
  );
}

// Atividade dos amigos e reviews da obra (com likes e comentários).
export async function ReviewsSection({
  itemId,
  viewerId,
  t,
  locale,
}: {
  itemId: string;
  viewerId: string | null;
  t: Dictionary;
  locale: Locale;
}) {
  const [reviews, friends] = await Promise.all([
    getItemReviews(itemId),
    viewerId ? getFriendsOnItem(viewerId, itemId) : null,
  ]);
  const [reviewLikes, commentCounts] = await Promise.all([
    getReviewLikes(reviews.map((r) => r.id), viewerId),
    getReviewCommentCounts(reviews.map((r) => r.id)),
  ]);
  return (
    <>
    {/* Atividade dos amigos (só para quem está logado): nota, like e status de quem você segue */}
    {friends && (
      <section>
        <h2 className="mb-3 border-b border-border pb-2 text-xs font-semibold tracking-widest text-muted uppercase">
          {t.movie.friendsActivity}
        </h2>
        {friends.length ? (
          <ul className="flex flex-wrap gap-4">
            {friends.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/u/${f.profiles.username}`}
                  title={f.profiles.display_name || f.profiles.username}
                  className="flex w-16 flex-col items-center gap-1 text-center"
                >
                  <Avatar profile={f.profiles} size={44} />
                  {f.rating ? (
                    <StarsDisplay rating={f.rating} />
                  ) : (
                    <span className="text-[11px] text-muted">
                      {f.status === "watchlist" ? "🕐" : f.status === "watching" ? "▶" : "✓"}
                    </span>
                  )}
                  {f.liked && <span className="-mt-1 text-xs text-like">♥</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t.movie.noFriendsActivity}</p>
        )}
      </section>
    )}
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
                  viewerId={viewerId}
                  initialCount={commentCounts.get(r.id) ?? 0}
                  actions={
                    <ReviewLike
                      entryId={r.id}
                      viewerId={viewerId}
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
    </>
  );
}

// Linha de números abaixo do pôster, no estilo do Letterboxd: ícone + número, detalhe no tooltip.
export function ItemStats({ stats, t, locale }: { stats: ItemStatsData; t: Dictionary; locale: Locale }) {
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
export function hoursAndMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m}min`;
}

// Classificação indicativa do país do idioma escolhido (pt → BR, en → US...); sem ela, a dos EUA.
export function Certification({
  certifications,
  locale,
  label,
}: {
  certifications: Record<string, string>;
  locale: Locale;
  label: string;
}) {
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

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
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

// Séries/animes: os nomes levam para a busca daquele tipo; emissoras entram nos detalhes.
export function toView(
  info: MovieInfoData & { networks?: { id: number; name: string }[] },
  t: Dictionary,
  locale: Locale,
  type?: "series" | "anime",
): MovieInfoView {
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
    `/search?${new URLSearchParams({ [key]: String(value), q: name, ...(type ? { type } : {}) })}`;
  const person = (p: { id: number; name: string }) => ({ name: p.name, href: browse("person", p.id, p.name) });

  return {
    cast: info.cast.map((p) => ({ ...person(p), character: p.character })),
    crew: CREW_ROLES.filter((role) => info.crew[role]?.length).map((role) => ({
      role,
      people: info.crew[role]!.map(person),
    })),
    details: [
      {
        label: t.info.networks,
        values: (info.networks ?? []).map((c) => ({ name: c.name, href: browse("network", c.id, c.name) })),
      },
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
