import type { Dictionary } from "./i18n/dictionaries";

// Opções do "Ordenar por" agrupadas em tópicos, como no Letterboxd:
// "Lançamento" → Mais novos primeiro / Mais antigos primeiro, e assim por diante.
// A ordem do menu é sempre a desta lista.
const MENU = [
  { key: "anticipated", group: "popularity", order: "anticipated" },
  { key: "week", group: "popularity", order: "thisWeek" },
  { key: "month", group: "popularity", order: "thisMonth" },
  { key: "year", group: "popularity", order: "thisYear" },
  { key: "popular", group: "popularity", order: "allTime" },
  { key: "comments", group: "popularity", order: "mostCommented" },
  { key: "title", group: "name", order: "az" },
  { key: "title-desc", group: "name", order: "za" },
  { key: "recent", group: "added", order: "newest" },
  { key: "recent-old", group: "added", order: "earliest" },
  { key: "release", group: "release", order: "newest" },
  { key: "release-old", group: "release", order: "earliest" },
  { key: "top", group: "average", order: "highest" },
  { key: "top-asc", group: "average", order: "lowest" },
  { key: "yours", group: "yours", order: "highest" },
  { key: "yours-asc", group: "yours", order: "lowest" },
  { key: "runtime", group: "length", order: "shortest" },
  { key: "runtime-desc", group: "length", order: "longest" },
] as const;

export type SortOption = { value: string; label: string; group?: string };

export function sortOptions(keys: readonly string[], t: Dictionary): SortOption[] {
  return MENU.filter((m) => keys.includes(m.key)).map((m) => ({
    value: m.key,
    label: t.movies.sortOrder[m.order],
    group: t.movies.sortGroups[m.group],
  }));
}
