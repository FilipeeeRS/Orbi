import { Suspense } from "react";
import Loading from "../loading";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { SettingsForm } from "./settings-form";
import { getItemsByIds } from "@/lib/queries";
import { itemTitle } from "@/lib/types";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = { title: "Configurações" };

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
      <div className="mb-6 flex items-center gap-3">
        <BackButton fallback={`/u/${viewer.username}`} label={t.common.back} />
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.settings.title}</h1>
      </div>
      <SettingsForm profile={viewer} favorites={favorites} />
    </div>
  );
}
