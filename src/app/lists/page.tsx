import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GridSkeleton } from "@/components/skeletons";
import { Pagination } from "@/components/pagination";
import { getDict, getViewer } from "@/lib/session";
import { browseLists, type ListSort } from "@/lib/lists";
import { ListCard } from "./list-card";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = { title: "Listas" };

const SORTS: ListSort[] = ["popular", "recent"];

export default function ListsPage(props: PageProps<"/lists">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ListsContent {...props} />
    </Suspense>
  );
}

// Todas as listas criadas no Orbi: populares (mais curtidas) ou recentes, 24 por página.
async function ListsContent({ searchParams }: PageProps<"/lists">) {
  const [{ t }, query, viewer] = await Promise.all([getDict(), searchParams, getViewer()]);
  const sort: ListSort = SORTS.includes(query.sort as ListSort) ? (query.sort as ListSort) : "popular";
  const page = Math.max(1, Number(query.page) || 1);
  const { lists, pages } = await browseLists(sort, page);
  const hrefFor = (s: ListSort, p = 1) => `/lists?${new URLSearchParams({ ...(s !== "popular" ? { sort: s } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <BackButton fallback="/home" label={t.common.back} />
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.lists.allTitle}</h1>
        </div>
        <nav className="flex gap-2">
          {SORTS.map((s) => (
            <Link
              key={s}
              href={hrefFor(s)}
              scroll={false}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                s === sort ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-fg hover:text-fg"
              }`}
            >
              {s === "popular" ? t.lists.sortPopular : t.lists.sortRecent}
            </Link>
          ))}
        </nav>
      </div>
      {lists.length === 0 ? (
        <p className="py-6 text-muted">{t.lists.noLists}</p>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} t={t} viewerId={viewer?.id ?? null} />
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} hrefFor={(p) => hrefFor(sort, p)} t={t} />
    </div>
  );
}
