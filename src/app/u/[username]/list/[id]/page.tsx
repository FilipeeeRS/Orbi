import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Loading from "../../../../loading";
import { Avatar } from "@/components/avatar";
import { Poster, PosterGrid } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { getList } from "@/lib/lists";
import { getViewerStates } from "@/lib/queries";
import { applyArtToItems } from "@/lib/art";
import { ListEditor } from "@/app/lists/list-editor";

export async function generateMetadata({ params }: PageProps<"/u/[username]/list/[id]">): Promise<Metadata> {
  const list = await getList((await params).id);
  return { title: list?.title };
}

export default function ListPage(props: PageProps<"/u/[username]/list/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ListContent {...props} />
    </Suspense>
  );
}

// Página de uma lista: nome, dono, descrição e os filmes na ordem (com o número da posição).
async function ListContent({ params }: PageProps<"/u/[username]/list/[id]">) {
  const { username, id } = await params;
  const [list, viewer, { t, locale }] = await Promise.all([getList(id), getViewer(), getDict()]);
  if (!list || list.owner.username !== username.toLowerCase()) notFound();

  const isOwner = viewer?.id === list.user_id;
  // Pôsteres escolhidos por quem está vendo (é pessoal) e os atalhos ✓/♥ nos pôsteres
  const [items, states] = await Promise.all([
    viewer ? applyArtToItems(viewer.id, list.items) : list.items,
    viewer ? getViewerStates(viewer.id, list.items.map((i) => i.id)) : null,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          {/* < (foto) @usuario / nome da lista */}
          <div className="flex items-center gap-2">
            <Link
              href={`/u/${list.owner.username}/all?tab=lists`}
              aria-label={t.movies.tabs.lists}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="size-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <Link href={`/u/${list.owner.username}`} className="shrink-0">
              <Avatar profile={list.owner} size={32} ring={list.owner.avatar_ring} />
            </Link>
            <h1 className="font-display min-w-0 text-3xl font-extrabold tracking-tight text-balance">
              <Link href={`/u/${list.owner.username}`} className="text-muted transition hover:text-fg">
                @{list.owner.username}
              </Link>
              <span className="mx-1.5 text-muted/50">/</span>
              {list.title}
            </h1>
          </div>
          {list.description && <p className="max-w-2xl text-muted whitespace-pre-line">{list.description}</p>}
          <p className="text-xs tracking-widest text-muted uppercase">{t.lists.count(items.length)}</p>
        </div>
        {isOwner && (
          <ListEditor listId={list.id} username={list.owner.username} variant="button" />
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{t.lists.emptyList}</p>
      ) : (
        <PosterGrid>
          {items.map((item, i) => (
            <div key={item.id} className="space-y-1">
              <Poster item={item} locale={locale} showMeta={false} eager={i < 8} viewer={viewer ? { id: viewer.id, state: states?.get(item.id) ?? null } : null} />
              <p className="text-center text-xs text-muted tabular-nums">{i + 1}</p>
            </div>
          ))}
        </PosterGrid>
      )}
    </div>
  );
}
