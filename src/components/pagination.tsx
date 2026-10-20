import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Paginação das listagens: « primeira · ← anterior · Página X de Y · próxima → · última ».
export function Pagination({
  page,
  pages,
  hrefFor,
  t,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
  t: Dictionary;
}) {
  if (pages <= 1) return null;
  const link = (to: number, label: React.ReactNode, title: string) =>
    to !== page && to >= 1 && to <= pages ? (
      <Link href={hrefFor(to)} title={title} className="hover:text-accent">
        {label}
      </Link>
    ) : (
      <span aria-hidden className="text-muted/40">
        {label}
      </span>
    );
  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4 text-sm">
      {link(1, "«", t.movies.first)}
      {link(page - 1, `← ${t.movies.prev}`, t.movies.prev)}
      <span className="text-muted">{t.movies.page(page, pages)}</span>
      {link(page + 1, `${t.movies.next} →`, t.movies.next)}
      {link(pages, "»", t.movies.last)}
    </nav>
  );
}
