import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import { getShowByRouteId } from "@/lib/catalog";
import { ShowPageContent } from "./show-page";

export async function generateMetadata({ params }: PageProps<"/series/[id]">): Promise<Metadata> {
  const item = await getShowByRouteId((await params).id);
  return { title: item ? `${item.title}${item.year ? ` (${item.year})` : ""}` : undefined };
}

export default function SeriesPage(props: PageProps<"/series/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/series/[id]">) {
  return <ShowPageContent id={(await params).id} />;
}
