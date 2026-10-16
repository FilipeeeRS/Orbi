import { Suspense } from "react";
import Loading from "../loading";
import type { Metadata } from "next";
import Link from "next/link";
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
      {/* Seta para voltar ao perfil */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/u/${viewer.username}`}
          aria-label={t.profile.tab}
          title={t.profile.tab}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="size-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.settings.title}</h1>
      </div>
      <SettingsForm profile={viewer} favorites={favorites} />
    </div>
  );
}
