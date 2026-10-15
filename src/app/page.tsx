import { Suspense } from "react";
import Loading from "./loading";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDict, getViewer } from "@/lib/session";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const viewer = await getViewer();
  if (viewer) redirect(`/u/${viewer.username}`);
  const { t } = await getDict();

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-16 text-center sm:py-24">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{t.home.title}</h1>
      <p className="max-w-xl text-muted text-balance">{t.home.subtitle}</p>
      <div className="flex flex-wrap justify-center gap-2 text-sm text-muted">
        {(["movie", "series", "music", "game", "book"] as const).map((k) => (
          <span key={k} className="rounded-full border border-border px-3 py-1">
            {t.folders[k]}
          </span>
        ))}
      </div>
      <Link href="/login" className="rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-fg hover:opacity-90">
        {t.home.cta}
      </Link>
    </section>
  );
}
