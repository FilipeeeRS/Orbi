import { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "../../../loading";
import { FolderView } from "../folder-view";
import { getDict } from "@/lib/session";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.folders.movie };
}

export default function MoviesPage(props: PageProps<"/u/[username]/movies">) {
  return (
    <Suspense fallback={<Loading />}>
      <MoviesPageContent {...props} />
    </Suspense>
  );
}

async function MoviesPageContent({ params, searchParams }: PageProps<"/u/[username]/movies">) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  return <FolderView username={username} query={query} kind="movie" path="movies" />;
}
