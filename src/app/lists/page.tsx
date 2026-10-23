import { Suspense } from "react";
import type { Metadata } from "next";
import { GridSkeleton } from "@/components/skeletons";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { getDict, getViewer } from "@/lib/session";
import { browseLists, LIST_SORTS, type UserListSort } from "@/lib/lists";
import { sortOptions } from "@/lib/sort-options";
import { MEDIA_KINDS, type MediaKind } from "@/lib/types";
import { ListsGrid } from "./lists-grid";
import { EmptyState, PageHeader } from "@/components/page-header";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.lists.allTitle };
}

export default function ListsPage(props: PageProps<"/lists">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ListsContent {...props} />
    </Suspense>
  );
}

// Todas as listas criadas no Orbi: título e Pasta · Ordenar por · lupa na mesma linha (como no Ver tudo
// das pastas) e a grade (com o "+ Nova lista" primeiro), 24 por página.
async function ListsContent({ searchParams }: PageProps<"/lists">) {
  const [{ t }, query, viewer] = await Promise.all([getDict(), searchParams, getViewer()]);
  const sort: UserListSort = LIST_SORTS.includes(query.sort as UserListSort) ? (query.sort as UserListSort) : "popular";
  const page = Math.max(1, Number(query.page) || 1);
  const folder = MEDIA_KINDS.includes(query.folder as MediaKind) ? (query.folder as MediaKind) : null;
  const q = typeof query.q === "string" ? query.q : undefined;
  const { lists, pages, total } = await browseLists(sort, page, folder, q);
  const pageHref = (n: number) => {
    const s = new URLSearchParams();
    for (const key of ["sort", "folder", "q"] as const) {
      const value = query[key];
      if (typeof value === "string" && value) s.set(key, value);
    }
    if (n > 1) s.set("page", String(n));
    return s.size ? `/lists?${s}` : "/lists";
  };

  return (
    <div className="space-y-6">
      {/* Título e filtros na mesma linha, como no Ver tudo das pastas */}
      <PageHeader back="/home" title={t.lists.allTitle} count={total}>
        <FilterBar
          labels={t.movies.filters}
          defaultSort="popular"
          sorts={sortOptions(LIST_SORTS, t)}
          folders={MEDIA_KINDS.map((k) => ({ value: k, label: t.folders[k] }))}
          decades={[]}
          genres={[]}
          ratings={[]}
        />
      </PageHeader>

      {lists.length === 0 && !viewer ? (
        <EmptyState>{t.lists.noLists}</EmptyState>
      ) : (
        <ListsGrid
          lists={lists}
          canCreate={!!viewer && page === 1}
          username={viewer?.username ?? null}
          viewerId={viewer?.id ?? null}
          t={t}
        />
      )}
      <Pagination page={page} pages={pages} hrefFor={pageHref} t={t} />
    </div>
  );
}
