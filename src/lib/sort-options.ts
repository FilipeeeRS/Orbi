import type { Dictionary } from "./i18n/dictionaries";

// Opções do "Ordenar por" agrupadas em tópicos, como no Letterboxd:
// "Lançamento" → Mais novos primeiro / Mais antigos primeiro, e assim por diante.
// As opções sem tópico (popularidade) ficam soltas no topo. A ordem do menu é sempre a desta lista.
const MENU = [
  { key: "week" },
  { key: "popular" },
  { key: "title", group: "name", order: "az" },
  { key: "title-desc", group: "name", order: "za" },
  { key: "recent", group: "added", order: "newest" },
  { key: "recent-old", group: "added", order: "earliest" },
  { key: "release", group: "release", order: "newest" },
  { key: "release-old", group: "release", order: "earliest" },
  { key: "top", group: "average", order: "highest" },
  { key: "yours", group: "yours", order: "highest" },
  { key: "runtime", group: "length", order: "shortest" },
  { key: "runtime-desc", group: "length", order: "longest" },
] as const;

export type SortOption = { value: string; label: string; group?: string };

export function sortOptions(keys: readonly string[], t: Dictionary): SortOption[] {
  return MENU.filter((m) => keys.includes(m.key)).map((m) =>
    "group" in m
      ? { value: m.key, label: t.movies.sortOrder[m.order], group: t.movies.sortGroups[m.group] }
      : { value: m.key, label: t.movies.sort[m.key] },
  );
}
