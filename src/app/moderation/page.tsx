import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Loading from "../loading";
import { getDict, getViewer } from "@/lib/session";
import { isAdmin, openReportCases } from "@/lib/moderation";
import { PageHeader, EmptyState } from "@/components/page-header";
import { CaseActions } from "./case-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.moderation.title };
}

export default function ModerationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ModerationContent />
    </Suspense>
  );
}

// Moderação: só para quem está em ADMIN_IDS (para os outros a página não existe). Cada cartão é um
// conteúdo denunciado, com as denúncias dele; remover tira do ar, descartar só arquiva.
async function ModerationContent() {
  const [viewer, { t }] = await Promise.all([getViewer(), getDict()]);
  if (!isAdmin(viewer)) notFound();
  const cases = await openReportCases();
  const date = new Intl.DateTimeFormat(t.htmlLang, { dateStyle: "medium" });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader back="/home" title={t.moderation.title} count={cases.length || null} />
      {cases.length === 0 ? (
        <EmptyState>{t.moderation.empty}</EmptyState>
      ) : (
        <ul className="space-y-4">
          {cases.map((c) => (
            <li key={`${c.targetType}:${c.targetId}`} className="space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-widest text-muted uppercase">
                  {t.moderation.types[c.targetType]} · {t.moderation.reports(c.reports.length)}
                </span>
                {c.content && (
                  <Link href={c.content.href} className="text-xs text-accent hover:underline">
                    {t.moderation.open}
                  </Link>
                )}
              </div>
              {c.content ? (
                <blockquote className="border-s-2 border-border ps-3">
                  <p className="text-xs text-muted">@{c.content.author}</p>
                  <p className="line-clamp-6 whitespace-pre-line">{c.content.text}</p>
                </blockquote>
              ) : (
                <p className="text-muted">{t.moderation.gone}</p>
              )}
              <ul className="space-y-1 text-xs text-muted">
                {c.reports.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium text-fg">{t.report.reasons[r.reason]}</span>
                    {r.details && <> — “{r.details}”</>} · @{r.reporter} · {date.format(new Date(r.created_at))}
                  </li>
                ))}
              </ul>
              <CaseActions targetType={c.targetType} targetId={c.targetId} canRemove={!!c.content} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
