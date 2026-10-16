import type { Locale } from "./i18n/dictionaries";
import type { AvatarRing } from "./avatar-ring";
import type { Attachment } from "./attachments";

export type MediaKind = "movie" | "series" | "music" | "game" | "book";
// "all" = pasta que junta todas as outras
export type FolderKind = MediaKind | "all";
export type EntryStatus = "watched" | "watchlist";

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
  kind: MediaKind;
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
  updated_at: string;
};

export type EntryWithItem = Entry & { items: Item };

export function itemTitle(item: Pick<Item, "title" | "translations">, locale: Locale) {
  return item.translations?.[locale]?.title || item.title;
}

export function itemOverview(item: Pick<Item, "overview" | "translations">, locale: Locale) {
  return item.translations?.[locale]?.overview || item.overview;
}

// Por enquanto só existem filmes: do TMDB pelo id deles, manuais pelo nosso id.
export function itemHref(item: Pick<Item, "id" | "source" | "external_id">) {
  return `/movie/${item.source === "tmdb" ? item.external_id : item.id}`;
}
