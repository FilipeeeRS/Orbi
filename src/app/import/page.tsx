import { Suspense } from "react";
import Loading from "../loading";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { LetterboxdImporter } from "./letterboxd-importer";

export const metadata: Metadata = { title: "Importar" };

export default function ImportPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ImportPageContent />
    </Suspense>
  );
}

async function ImportPageContent() {
  const [viewer, { t }] = await Promise.all([getViewer(), getDict()]);
  if (!viewer) redirect("/login?next=/import");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t.import.title}</h1>
      <p className="text-muted">{t.import.steps}</p>
      <p className="text-xs text-muted">{t.import.note}</p>
      <LetterboxdImporter username={viewer.username} />
    </div>
  );
}
