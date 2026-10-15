import { Suspense } from "react";
import Loading from "../loading";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { SettingsForm } from "./settings-form";
import { getItemsByIds } from "@/lib/queries";
import { itemTitle } from "@/lib/types";

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
      <h1 className="font-display mb-6 text-3xl font-extrabold tracking-tight">{t.settings.title}</h1>
      <SettingsForm profile={viewer} locale={viewer.locale ?? locale} favorites={favorites} />
    </div>
  );
}
