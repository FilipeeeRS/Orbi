import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GridSkeleton } from "@/components/skeletons";
import type { FolderKind } from "@/lib/types";
import { FolderView } from "../folder-view";

// Pastas além de filmes (que têm a própria rota em /movies). "all" junta tudo.
const FOLDER_SLUGS: Record<string, FolderKind> = {
  all: "all",
  series: "series",
  anime: "anime",
  manga: "manga",
  music: "music",
  games: "game",
  books: "book",
};

export default function FolderPage(props: PageProps<"/u/[username]/[folder]">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <FolderPageContent {...props} />
    </Suspense>
  );
}

async function FolderPageContent({ params, searchParams }: PageProps<"/u/[username]/[folder]">) {
  const [{ username, folder }, query] = await Promise.all([params, searchParams]);
  const kind = FOLDER_SLUGS[folder];
  if (!kind) notFound();
  return <FolderView username={username} query={query} kind={kind} path={folder} />;
}
