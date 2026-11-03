import { Suspense } from "react";
import { shareMeta } from "@/lib/share";
import { ItemSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { getShowByRouteId } from "@/lib/catalog";
import { ShowPageContent } from "./show-page";

export async function generateMetadata({ params }: PageProps<"/series/[id]">): Promise<Metadata> {
  const item = await getShowByRouteId((await params).id);
  if (!item) return {};
  // Prévia do link: título (ano), sinopse e pôster
  return shareMeta({ title: `${item.title}${item.year ? ` (${item.year})` : ""}`, description: item.overview, image: item.poster_url });
}

export default function SeriesPage(props: PageProps<"/series/[id]">) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/series/[id]">) {
  return <ShowPageContent id={(await params).id} />;
}
