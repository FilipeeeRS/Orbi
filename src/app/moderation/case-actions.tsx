"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n";
import { useToast } from "@/components/toast";
import { resolveReports } from "./actions";
import type { ReportTarget } from "@/app/report-actions";

// Botões de um conteúdo denunciado: remover (pede confirmação) ou descartar as denúncias.
export function CaseActions({ targetType, targetId, canRemove }: { targetType: ReportTarget; targetId: string; canRemove: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(action: "remove" | "dismiss") {
    if (action === "remove" && !confirm(t.moderation.confirmRemove)) return;
    start(async () => {
      const { ok } = await resolveReports(targetType, targetId, action);
      toast(ok ? { message: action === "remove" ? t.moderation.removed : t.moderation.dismissed } : { message: t.toast.error, tone: "error" });
      if (ok) router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("dismiss")}
        className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40"
      >
        {t.moderation.dismiss}
      </button>
      {canRemove && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("remove")}
          className="rounded-lg bg-danger px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {t.moderation.remove}
        </button>
      )}
    </div>
  );
}
