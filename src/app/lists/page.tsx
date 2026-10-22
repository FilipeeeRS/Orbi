import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GridSkeleton } from "@/components/skeletons";
import { Pagination } from "@/components/pagination";
import { getDict, getViewer } from "@/lib/session";
import { browseLists, type ListSort } from "@/lib/lists";
import { ListsGrid } from "./lists-grid";
import { FolderIcon } from "@/components/folder-icon";
import { MEDIA_KINDS, type MediaKind } from "@/lib/types";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = { title: "Listas" };

const SORTS: ListSort[] = ["popular", "recent", "comments"];

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
  const folder = MEDIA_KINDS.includes(query.folder as MediaKind) ? (query.folder as MediaKind) : null;
  const { lists, pages } = await browseLists(sort, page, folder);
  const hrefFor = (s: ListSort, p = 1, f: MediaKind | null = folder) =>
    `/lists?${new URLSearchParams({ ...(s !== "popular" ? { sort: s } : {}), ...(f ? { folder: f } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;
  const chip = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
      active ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-fg hover:text-fg"
    }`;

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
              {s === "popular" ? t.lists.sortPopular : s === "recent" ? t.lists.sortRecent : t.lists.sortComments}
            </Link>
          ))}
        </nav>
      </div>
      {/* Pastas: listas com pelo menos uma obra daquela pasta */}
      <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Link href={hrefFor(sort, 1, null)} scroll={false} className={chip(!folder)}>
          {t.folders.all}
        </Link>
        {MEDIA_KINDS.map((k) => (
          <Link key={k} href={hrefFor(sort, 1, k)} scroll={false} className={chip(folder === k)}>
            <FolderIcon kind={k} className="size-3.5" />
            {t.folders[k]}
          </Link>
        ))}
      </nav>
      {lists.length === 0 && !viewer ? (
        <p className="py-6 text-muted">{t.lists.noLists}</p>
      ) : (
        <ListsGrid
          lists={lists}
          canCreate={!!viewer && page === 1}
          username={viewer?.username ?? null}
          viewerId={viewer?.id ?? null}
          t={t}
        />
      )}
      <Pagination page={page} pages={pages} hrefFor={(p) => hrefFor(sort, p)} t={t} />
    </div>
  );
}
