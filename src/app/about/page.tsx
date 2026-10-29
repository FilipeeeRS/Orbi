import { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "../loading";
import { GITHUB_URL } from "@/components/site-footer";
import { getDict } from "@/lib/session";
import { AboutNav } from "./about-nav";
import { PageHeader } from "@/components/page-header";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.footer.about };
}

// Ordem das seções (os textos ficam no dicionário, em about.sections).
const SECTIONS = [
  "what",
  "how",
  "import",
  "profile",
  "data",
  "news",
  "source",
] as const;

export default function AboutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AboutContent />
    </Suspense>
  );
}

// Sobre no formato de central de informações: menu de seções à esquerda, texto corrido à direita.
async function AboutContent() {
  const { t } = await getDict();
  const sections = SECTIONS.map((id) => ({ id, ...t.about.sections[id] }));

  return (
    <div className="space-y-6">
      {/* Cabeçalho padrão (toda página tem um título principal) */}
      <PageHeader back="/home" title={t.footer.about} />
      <div className="grid gap-12 py-4 md:grid-cols-[220px_minmax(0,1fr)] md:py-8">
        <AboutNav items={sections.map(({ id, title }) => ({ id, title }))} />

        <article className="max-w-2xl space-y-14">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
              {s.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-serif text-lg leading-relaxed text-fg/85"
                >
                  {paragraph}
                </p>
              ))}
              {s.id === "source" && (
                <p className="font-serif text-lg">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline underline-offset-4 hover:opacity-80"
                  >
                    {t.about.cta}
                  </a>
                </p>
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
