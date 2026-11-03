"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/session";
import { isAdmin } from "@/lib/moderation";
import type { ReportTarget } from "@/app/report-actions";

// Fecha todas as denúncias de um conteúdo: "remove" tira o conteúdo do ar, "dismiss" só arquiva.
// Review removida perde o texto, os anexos, os comentários e as curtidas (a nota e o registro ficam).
export async function resolveReports(targetType: ReportTarget, targetId: string, action: "remove" | "dismiss"): Promise<{ ok: boolean }> {
  if (!isAdmin(await getViewer())) return { ok: false };
  const admin = createAdminClient();

  if (action === "remove") {
    const removal =
      targetType === "review"
        ? await Promise.all([
            admin.from("review_comments").delete().eq("entry_id", targetId),
            admin.from("review_likes").delete().eq("entry_id", targetId),
            admin.from("entries").update({ review: null, attachments: [] }).eq("id", targetId),
          ]).then((all) => all.find((r) => r.error) ?? { error: null })
        : targetType === "review_comment"
          ? await admin.from("review_comments").delete().eq("id", targetId)
          : targetType === "list"
            ? await admin.from("lists").delete().eq("id", targetId)
            : await admin.from("list_comments").delete().eq("id", targetId);
    if (removal.error) return { ok: false };
  }

  const { error } = await admin
    .from("reports")
    .update({ status: action === "remove" ? "resolved" : "dismissed" })
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open");
  revalidatePath("/moderation");
  return { ok: !error };
}
