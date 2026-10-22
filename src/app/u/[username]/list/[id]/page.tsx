import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GridSkeleton } from "@/components/skeletons";
import { Avatar } from "@/components/avatar";
import { Poster, PosterGrid } from "@/components/poster";
import { getDict, getViewer } from "@/lib/session";
import { getList, getListSocial } from "@/lib/lists";
import { ListActions, ListComments } from "./list-social";
import { getViewerStates } from "@/lib/queries";
import { applyArtToItems } from "@/lib/art";
import { ListEditor } from "@/app/lists/list-editor";
import { BackButton } from "@/components/back-button";

export async function generateMetadata({ params }: PageProps<"/u/[username]/list/[id]">): Promise<Metadata> {
  const list = await getList((await params).id);
  return { title: list?.title };
}

export default function ListPage(props: PageProps<"/u/[username]/list/[id]">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ListContent {...props} />
    </Suspense>
  );
}

// Página de uma lista: nome, dono, descrição, curtir/comentar/denunciar, as obras na ordem (com a posição)
// e os comentários.
async function ListContent({ params }: PageProps<"/u/[username]/list/[id]">) {
  const { username, id } = await params;
  const [list, viewer, { t, locale }] = await Promise.all([getList(id), getViewer(), getDict()]);
  if (!list || list.owner.username !== username.toLowerCase()) notFound();

  const isOwner = viewer?.id === list.user_id;
  // Pôsteres escolhidos por quem está vendo (é pessoal) e os atalhos ✓/♥ nos pôsteres
  const [items, states, social] = await Promise.all([
    viewer ? applyArtToItems(viewer.id, list.items) : list.items,
    viewer ? getViewerStates(viewer.id, list.items.map((i) => i.id)) : null,
    getListSocial(list.id, viewer?.id ?? null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          {/* < (foto) @usuario / nome da lista */}
          <div className="flex items-center gap-2">
            <BackButton fallback={`/u/${list.owner.username}/all?tab=lists`} label={t.common.back} />
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
        {/* À direita do título, na mesma linha: Editar (dono), ♥ curtir, marcador salvar e ⋯ denunciar */}
        <div className="ms-auto flex items-center gap-4">
          {isOwner && <ListEditor listId={list.id} username={list.owner.username} variant="button" />}
          <ListActions
            listId={list.id}
            ownerId={list.user_id}
            viewerId={viewer?.id ?? null}
            initialLiked={social.liked}
            initialLikes={social.likes}
            initialSaved={social.saved}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{t.lists.emptyList}</p>
      ) : (
        <PosterGrid>
          {items.map((item, i) => (
            <div key={item.id} className="space-y-1">
              <Poster badge={false} item={item} locale={locale} eager={i < 8} viewer={viewer ? { id: viewer.id, state: states?.get(item.id) ?? null } : null} />
              <p className="text-center text-xs text-muted tabular-nums">{i + 1}</p>
            </div>
          ))}
        </PosterGrid>
      )}

      <ListComments listId={list.id} ownerId={list.user_id} viewerId={viewer?.id ?? null} initial={social.comments} />
    </div>
  );
}
