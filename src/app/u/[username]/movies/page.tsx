import { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "../../../loading";
import { FolderView } from "../folder-view";

export const metadata: Metadata = { title: "Filmes" };

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
