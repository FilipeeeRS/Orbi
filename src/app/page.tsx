import { Suspense } from "react";
import Loading from "./loading";
import Link from "next/link";
import { HomeDashboard } from "./home-dashboard";
import { getDict, getViewer } from "@/lib/session";
import { SearchSuggest } from "@/components/search-suggest";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  // Logado: a tela inicial vira a Home com amigos e populares da semana.
  if (viewer) return <HomeDashboard viewer={viewer} t={t} locale={locale} />;

  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 py-16 text-center sm:py-24">
      <p className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-xs font-semibold tracking-widest text-accent uppercase">
        {t.home.tagline}
      </p>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{t.home.title}</h1>
      <p className="max-w-2xl text-muted text-balance">{t.home.subtitle}</p>
      {/* Busca em destaque no meio da página inicial, com sugestões */}
      <SearchSuggest placeholder={t.nav.search} size="lg" className="w-full max-w-lg" />
      <Link href="/home" className="rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-fg hover:opacity-90">
        {t.home.cta}
      </Link>
    </section>
  );
}
