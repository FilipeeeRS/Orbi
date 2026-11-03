import Link from "next/link";
import { AboutNav } from "@/app/about/about-nav";
import { PageHeader } from "./page-header";
import { CONTACT_EMAIL } from "./site-footer";
import { getDict } from "@/lib/session";
import { fill } from "@/lib/i18n/fill";
import { getLegal, LEGAL_UPDATED, type LegalTexts } from "@/lib/i18n/legal";

const link = "text-accent underline underline-offset-2 hover:opacity-80";

// Privacidade, Termos e Cookies: mesmo formato do Sobre (menu de seções à esquerda, texto à direita).
export async function LegalPage({ doc }: { doc: keyof LegalTexts }) {
  const { t, locale } = await getDict();
  const page = (await getLegal(locale))[doc];
  const updated = new Intl.DateTimeFormat(t.htmlLang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${LEGAL_UPDATED}T12:00:00Z`));
  const parts = {
    email: (
      <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
        {CONTACT_EMAIL}
      </a>
    ),
    privacy: <Link href="/privacy" className={link}>{t.legal.privacy}</Link>,
    terms: <Link href="/terms" className={link}>{t.legal.terms}</Link>,
    cookies: <Link href="/cookies" className={link}>{t.legal.cookies}</Link>,
    settings: <Link href="/settings" className={link}>{t.settings.title}</Link>,
  };
  const text = "leading-relaxed text-fg/85";

  return (
    <div className="space-y-6">
      <PageHeader back="/home" title={page.title} />
      <div className="grid gap-12 py-4 md:grid-cols-[220px_minmax(0,1fr)] md:py-8">
        <AboutNav items={page.sections.map(({ id, title }) => ({ id, title }))} />

        <article className="max-w-2xl space-y-10">
          <div className="space-y-3">
            <p className="text-sm text-muted">{t.legal.updated(updated)}</p>
            <p className={`text-lg ${text}`}>{fill(page.intro, parts)}</p>
          </div>
          {page.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold tracking-tight">{s.title}</h2>
              {s.body.map((paragraph) => (
                <p key={paragraph} className={text}>
                  {fill(paragraph, parts)}
                </p>
              ))}
              {s.list && (
                <ul className={`list-disc space-y-1.5 ps-5 ${text}`}>
                  {s.list.map((item) => (
                    <li key={item}>{fill(item, parts)}</li>
                  ))}
                </ul>
              )}
              {s.items && (
                <dl className="divide-y divide-border rounded-xl border border-border">
                  {s.items.map(([name, purpose]) => (
                    <div key={name} className="grid gap-1 p-3 sm:grid-cols-[250px_minmax(0,1fr)] sm:gap-4">
                      {/* Vários nomes com a mesma função: um por linha */}
                      <dt className="space-y-0.5">
                        {name.split(", ").map((n) => (
                          <code key={n} className="block text-sm [overflow-wrap:anywhere]">
                            {n}
                          </code>
                        ))}
                      </dt>
                      <dd className={`text-sm ${text}`}>{fill(purpose, parts)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
