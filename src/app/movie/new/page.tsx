import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { ManualMovieForm } from "./manual-movie-form";

export const metadata: Metadata = { title: "Adicionar filme" };

export default async function NewMoviePage({ searchParams }: PageProps<"/movie/new">) {
  const [viewer, { t }, query] = await Promise.all([getViewer(), getDict(), searchParams]);
  if (!viewer) redirect("/login?next=/movie/new");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t.manual.title}</h1>
      <p className="text-sm text-muted">{t.manual.hint}</p>
      <ManualMovieForm userId={viewer.id} initialTitle={String(query.title ?? "").slice(0, 300)} />
    </div>
  );
}
