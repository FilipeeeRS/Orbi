import { Suspense } from "react";
import { shareMeta } from "@/lib/share";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { getAniListByRouteId } from "@/lib/catalog";
import { AniListPageContent } from "./anilist-page";

export async function generateMetadata({ params }: PageProps<"/anime/[id]">): Promise<Metadata> {
  const item = await getAniListByRouteId("anime", (await params).id);
  if (!item) return {};
  // Prévia do link: título (ano), sinopse e pôster
  return shareMeta({ title: `${item.title}${item.year ? ` (${item.year})` : ""}`, description: item.overview, image: item.poster_url });
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
