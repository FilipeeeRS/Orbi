import { Suspense } from "react";
import { RowSkeleton } from "@/components/skeletons";
import { ExternalPosters, type ExternalPoster } from "@/components/external-posters";
import { adultMovieIds } from "@/lib/catalog";
import { getRecommendations, isAnime, releaseYear, tmdbImage, type TmdbType } from "@/lib/tmdb";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

// Uma linha só: 6 pôsteres (3 no celular).
const LIMIT = 6;

// Fim da página de um filme ou série: obras parecidas, do mesmo tipo, com os atalhos ✓ ▶ ♥ 🕐 no pôster.
type RecommendationsProps = { type: TmdbType; tmdbId: string; language: string; viewer: Profile | null; t: Dictionary };

// Carrega à parte, com uma fileira de esqueleto no lugar.
export function Recommendations(props: RecommendationsProps) {
  return (
    <Suspense
      fallback={
        <PosterSection title={props.t.movie.recommendations}>
          <RowSkeleton />
        </PosterSection>
      }
    >
      <RecommendationsContent {...props} />
    </Suspense>
  );
}

async function RecommendationsContent({ type, tmdbId, language, viewer, t }: RecommendationsProps) {
  let list = await getRecommendations(type, tmdbId, language);
  // Mesmas regras das listagens: sem anime nas séries e sem +18 para quem não ativou.
  if (type === "tv") list = list.filter((m) => !isAnime(m));
  if (type === "movie" && !viewer?.show_adult) {
    const adult = await adultMovieIds(list.slice(0, LIMIT * 2).map((m) => m.id));
    list = list.filter((m) => !adult.has(m.id));
  }
  const posters: ExternalPoster[] = list.slice(0, LIMIT).map((m) => ({
    id: m.id,
    title: m.title,
    year: releaseYear(m),
    poster: tmdbImage(m.poster_path, "w342"),
    rating: m.vote_average ? m.vote_average / 2 : null, unreleased: !!m.release_date && m.release_date > new Date().toISOString().slice(0, 10),
  }));
  if (!posters.length) return null;
  return (
    <PosterSection title={t.movie.recommendations}>
      <ExternalPosters kind={type === "tv" ? "series" : "movie"} list={posters} viewer={viewer} layout="row" />
    </PosterSection>
  );
}

export function PosterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-border pb-2 text-xs font-semibold tracking-widest text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}
