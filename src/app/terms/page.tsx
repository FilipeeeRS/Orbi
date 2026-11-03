import { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "../loading";
import { getDict } from "@/lib/session";
import { LegalPage } from "@/components/legal-page";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.legal.terms };
}

export default function TermsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LegalPage doc="terms" />
    </Suspense>
  );
}
