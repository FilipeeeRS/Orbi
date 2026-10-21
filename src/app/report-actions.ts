"use server";

import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/session";

export type ReportTarget = "review" | "review_comment" | "list" | "list_comment";
export type ReportReason = "spam" | "offensive" | "harassment" | "spoiler" | "other";
const REASONS: ReportReason[] = ["spam", "offensive", "harassment", "spoiler", "other"];
const TARGETS: ReportTarget[] = ["review", "review_comment", "list", "list_comment"];

// Denunciar algo: uma vez por pessoa por conteúdo (denunciar de novo conta como já feito).
export async function reportContent(
  targetType: ReportTarget,
  targetId: string,
  reason: ReportReason,
  details: string,
): Promise<{ ok: boolean; already?: boolean }> {
  const viewer = await getViewer();
  if (!viewer || !TARGETS.includes(targetType) || !REASONS.includes(reason)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details.trim().slice(0, 500) || null,
  });
  if (error?.code === "23505") return { ok: true, already: true };
  return { ok: !error };
}
