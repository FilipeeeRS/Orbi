import { Suspense } from "react";
import Loading from "../loading";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { SettingsForm } from "./settings-form";
import { getItemsByIds } from "@/lib/queries";
import { itemTitle } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.settings.title };
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsPageContent />
    </Suspense>
  );
}

async function SettingsPageContent() {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  if (!viewer) redirect("/login?next=/settings");
  const favorites = (await getItemsByIds(viewer.favorites ?? [])).map((i) => ({
    id: i.id,
    title: itemTitle(i, locale),
    poster_url: i.poster_url,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      {/* Seta para voltar (sem histórico, o perfil) */}
      <div className="mb-6">
        <PageHeader back={`/u/${viewer.username}`} title={t.settings.title} />
      </div>
      <SettingsForm profile={viewer} favorites={favorites} />
    </div>
  );
}
