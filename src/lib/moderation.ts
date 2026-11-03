import "server-only";
import { createAdminClient } from "./supabase/admin";
import { itemHref, type Item, type Profile } from "./types";
import type { ReportReason, ReportTarget } from "@/app/report-actions";

// Moderadores: ids de usuário na variável ADMIN_IDS (separados por vírgula), configurada na Vercel.
export function isAdmin(viewer: Pick<Profile, "id"> | null) {
  const ids = (process.env.ADMIN_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return !!viewer && ids.includes(viewer.id);
}

export type ReportCase = {
  targetType: ReportTarget;
  targetId: string;
  reports: { reason: ReportReason; details: string | null; created_at: string; reporter: string }[];
  // O que foi denunciado (null = já não existe)
  content: { author: string; text: string; href: string } | null;
};

const AUTHOR = "author:profiles!%s_user_id_fkey(username)";
const ITEM = "item:items(id, kind, source, external_id)";
type ItemRef = Pick<Item, "id" | "kind" | "source" | "external_id"> | null;

// Denúncias abertas agrupadas por conteúdo (mais denunciado primeiro), com o texto denunciado.
export async function openReportCases(): Promise<ReportCase[]> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("reports")
    .select("target_type, target_id, reason, details, created_at, reporter:profiles!reports_reporter_id_fkey(username)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(500);

  const cases = new Map<string, ReportCase>();
  for (const r of (rows ?? []) as unknown as {
    target_type: ReportTarget;
    target_id: string;
    reason: ReportReason;
    details: string | null;
    created_at: string;
    reporter: { username: string } | null;
  }[]) {
    const key = `${r.target_type}:${r.target_id}`;
    const c = cases.get(key) ?? { targetType: r.target_type, targetId: r.target_id, reports: [], content: null };
    c.reports.push({ reason: r.reason, details: r.details, created_at: r.created_at, reporter: r.reporter?.username ?? "?" });
    cases.set(key, c);
  }

  const ids = (type: ReportTarget) => [...cases.values()].filter((c) => c.targetType === type).map((c) => c.targetId);
  const [reviews, comments, lists, listComments] = await Promise.all([
    ids("review").length
      ? admin.from("entries").select(`id, review, ${ITEM}, ${AUTHOR.replace("%s", "entries")}`).in("id", ids("review"))
      : { data: [] },
    ids("review_comment").length
      ? admin.from("review_comments").select(`id, body, entry:entries(${ITEM}), ${AUTHOR.replace("%s", "review_comments")}`).in("id", ids("review_comment"))
      : { data: [] },
    ids("list").length
      ? admin.from("lists").select(`id, title, description, ${AUTHOR.replace("%s", "lists")}`).in("id", ids("list"))
      : { data: [] },
    ids("list_comment").length
      ? admin.from("list_comments").select(`id, body, list:lists(id, owner:profiles!lists_user_id_fkey(username)), ${AUTHOR.replace("%s", "list_comments")}`).in("id", ids("list_comment"))
      : { data: [] },
  ]);

  type Row = { id: string; author: { username: string } | null } & Record<string, unknown>;
  const set = (type: ReportTarget, data: unknown, content: (r: Row) => { text: string; href: string } | null) => {
    for (const r of (data ?? []) as Row[]) {
      const c = cases.get(`${type}:${r.id}`);
      const body = content(r);
      if (c && body) c.content = { author: r.author?.username ?? "?", ...body };
    }
  };
  // Reviews e comentários de review levam para a página da obra; listas e seus comentários, para a lista
  const item = (ref: ItemRef) => (ref ? itemHref(ref) : "/");
  set("review", reviews.data, (r) => (r.review ? { text: String(r.review), href: item(r.item as ItemRef) } : null));
  set("review_comment", comments.data, (r) => ({ text: String(r.body ?? ""), href: item((r.entry as { item: ItemRef } | null)?.item ?? null) }));
  set("list", lists.data, (r) => ({ text: [r.title, r.description].filter(Boolean).join(" — "), href: `/u/${r.author?.username}/list/${r.id}` }));
  set("list_comment", listComments.data, (r) => {
    const list = r.list as { id: string; owner: { username: string } | null } | null;
    return list ? { text: String(r.body ?? ""), href: `/u/${list.owner?.username}/list/${list.id}` } : null;
  });
  return [...cases.values()].sort((a, b) => b.reports.length - a.reports.length);
}
