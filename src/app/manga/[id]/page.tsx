import { Suspense } from "react";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { getAniListByRouteId } from "@/lib/catalog";
import { AniListPageContent } from "../../anime/[id]/anilist-page";

export async function generateMetadata({ params }: PageProps<"/manga/[id]">): Promise<Metadata> {
  const item = await getAniListByRouteId("manga", (await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

// Mangá (dados do AniList): mesma página do anime, com capítulos e volumes.
export default function MangaPage(props: PageProps<"/manga/[id]">) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/manga/[id]">) {
  return <AniListPageContent id={(await params).id} kind="manga" />;
}
