import type { Locale } from "./i18n/dictionaries";

export type MediaKind = "movie" | "series" | "music" | "game" | "book";
export type EntryStatus = "watched" | "watchlist";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
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
  title_pt: string | null;
  original_title: string | null;
  year: number | null;
  overview: string | null;
  overview_pt: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  created_by: string | null;
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
  updated_at: string;
};

export type EntryWithItem = Entry & { items: Item };

export function itemTitle(item: Pick<Item, "title" | "title_pt">, locale: Locale) {
  return (locale === "pt" && item.title_pt) || item.title;
}

// Por enquanto só existem filmes: do TMDB pelo id deles, manuais pelo nosso id.
export function itemHref(item: Pick<Item, "id" | "source" | "external_id">) {
  return `/movie/${item.source === "tmdb" ? item.external_id : item.id}`;
}
