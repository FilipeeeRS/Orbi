import { Suspense } from "react";
import Loading from "../loading";
import { HomeDashboard } from "../home-dashboard";
import { getDict, getViewer } from "@/lib/session";

// Home aberta a visitantes ("Get started" da página inicial). Logado, é a mesma Home de "/".
export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  return <HomeDashboard viewer={viewer} t={t} locale={locale} />;
}
