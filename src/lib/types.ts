import type { Locale } from "./i18n/dictionaries";
import type { AvatarRing } from "./avatar-ring";
import type { Attachment } from "./attachments";

export type MediaKind = "movie" | "series" | "book" | "anime" | "manga" | "game" | "music";
// Ordem das pastas em todo o site (menu, perfil, Home).
export const MEDIA_KINDS: MediaKind[] = ["movie", "series", "book", "anime", "manga", "game", "music"];
// "all" = pasta que junta todas as outras
export type FolderKind = MediaKind | "all";
// No catálogo, cada temporada de série também é um item (com nota e review próprias).
export type ItemKind = MediaKind | "season";
// "watching" só existe em séries e temporadas.
export type EntryStatus = "watched" | "watchlist" | "watching";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  sticker_url: string | null; // imagem sem fundo no canto da capa
  location: string | null;
  website: string | null;
  pronouns: string | null;
  is_private: boolean;
  show_adult: boolean;
  favorites: string[];
  avatar_ring: AvatarRing | null; // null enquanto a migration da borda não foi aplicada
  bio: string | null;
  locale: Locale | null;
  created_at: string;
};

export type Item = {
  id: string;
  kind: ItemKind;
  source: string;
  external_id: string | null;
  title: string;
  original_title: string | null;
  year: number | null;
  overview: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  created_by: string | null;
  tmdb_rating: number | null;
  tmdb_votes: number | null;
  is_adult_rated: boolean | null;
  genre_ids: number[];
  runtime: number | null;
  release_date: string | null;
  parent_id?: string | null; // temporada → série
  season_number?: number | null;
  episode_count?: number | null;
  // Animes e mangás (cópia do AniList)
  mal_id?: number | null;
  format?: string | null;
  status?: string | null;
  season?: string | null;
  season_year?: number | null;
  genres?: string[];
  chapters?: number | null;
  volumes?: number | null;
  translations: Partial<Record<Locale, { title?: string; overview?: string }>>;
};

export type Entry = {
  id: string;
  user_id: string;
  item_id: string;
  status: EntryStatus;
  rating: number | null; // 1..10 (meias estrelas)
  liked: boolean;
  review: string | null;
  watched_on: string | null;
  attachments: Attachment[]; // anexos da review (imagens, GIFs, PDF, Word, vídeos)
  current_season?: number | null; // "Assistindo": onde a pessoa parou (só séries)
  current_episode?: number | null;
  updated_at: string;
};

export type EntryWithItem = Entry & { items: Item };

export function itemTitle(item: Pick<Item, "title" | "translations">, locale: Locale) {
  return item.translations?.[locale]?.title || item.title;
}

export function itemOverview(item: Pick<Item, "overview" | "translations">, locale: Locale) {
  return item.translations?.[locale]?.overview || item.overview;
}

// Itens do TMDB pelo id deles (temporada = "série/número"), manuais pelo nosso id.
export function itemHref(item: Pick<Item, "id" | "source" | "external_id"> & { kind?: ItemKind }) {
  if (item.kind === "series") return `/series/${item.external_id}`;
  if (item.kind === "anime") return `/anime/${item.external_id}`;
  if (item.kind === "manga") return `/manga/${item.external_id}`;
  if (item.kind === "book") return `/book/${item.external_id}`;
  if (item.kind === "game") return `/game/${item.external_id}`;
  if (item.kind === "season") {
    const [show, season] = (item.external_id ?? "").split("/");
    return `/series/${show}/season/${season}`;
  }
  return `/movie/${item.source === "tmdb" ? item.external_id : item.id}`;
}
