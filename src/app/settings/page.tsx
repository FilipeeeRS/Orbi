import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  if (!viewer) redirect("/login?next=/settings");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">{t.settings.title}</h1>
      <SettingsForm profile={viewer} locale={viewer.locale ?? locale} />
    </div>
  );
}
