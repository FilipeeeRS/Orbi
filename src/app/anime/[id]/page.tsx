import { Suspense } from "react";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { getAniListByRouteId } from "@/lib/catalog";
import { AniListPageContent } from "./anilist-page";

export async function generateMetadata({ params }: PageProps<"/anime/[id]">): Promise<Metadata> {
  const item = await getAniListByRouteId("anime", (await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

// Anime (uma temporada, dados do AniList).
export default function AnimePage(props: PageProps<"/anime/[id]">) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/anime/[id]">) {
  return <AniListPageContent id={(await params).id} kind="anime" />;
}
