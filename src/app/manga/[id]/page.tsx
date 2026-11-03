import { Suspense } from "react";
import { shareMeta } from "@/lib/share";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { getAniListByRouteId } from "@/lib/catalog";
import { AniListPageContent } from "../../anime/[id]/anilist-page";

export async function generateMetadata({ params }: PageProps<"/manga/[id]">): Promise<Metadata> {
  const item = await getAniListByRouteId("manga", (await params).id);
  if (!item) return {};
  // Prévia do link: título (ano), sinopse e pôster
  return shareMeta({ title: `${item.title}${item.year ? ` (${item.year})` : ""}`, description: item.overview, image: item.poster_url });
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
