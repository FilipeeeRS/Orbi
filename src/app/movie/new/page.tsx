import { Suspense } from "react";
import Loading from "../../loading";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { ManualMovieForm } from "./manual-movie-form";
import { PageHeader } from "@/components/page-header";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.manual.title };
}

export default function NewMoviePage(props: PageProps<"/movie/new">) {
  return (
    <Suspense fallback={<Loading />}>
      <NewMoviePageContent {...props} />
    </Suspense>
  );
}

async function NewMoviePageContent({ searchParams }: PageProps<"/movie/new">) {
  const [viewer, { t }, query] = await Promise.all([getViewer(), getDict(), searchParams]);
  if (!viewer) redirect("/login?next=/movie/new");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader back="/search" title={t.manual.title} />
      <p className="text-sm text-muted">{t.manual.hint}</p>
      <ManualMovieForm userId={viewer.id} initialTitle={String(query.title ?? "").slice(0, 300)} />
    </div>
  );
}
