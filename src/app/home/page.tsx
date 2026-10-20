import { Suspense } from "react";
import Loading from "../loading";
import { HomeDashboard } from "../home-dashboard";
import { getDict, getViewer } from "@/lib/session";

// Home aberta a visitantes ("Get started" da página inicial). Logado, é a mesma Home de "/".
export default function HomePage(props: PageProps<"/home">) {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent {...props} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: PageProps<"/home">) {
  const [viewer, { t, locale }, query] = await Promise.all([getViewer(), getDict(), searchParams]);
  return <HomeDashboard viewer={viewer} t={t} locale={locale} folder={query.folder} />;
}
