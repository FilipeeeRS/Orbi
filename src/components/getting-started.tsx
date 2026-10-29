import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";
import { HideGettingStarted, StartQuickLog } from "./getting-started-actions";

export const GETTING_STARTED_COOKIE = "orbi-getting-started-hidden";

// "Primeiros passos" no topo da Home de quem acabou de chegar: dar nota a 5 obras, seguir 3 pessoas,
// completar o perfil e trazer o histórico do Letterboxd. Some quando tudo está feito (ou ao esconder).
export async function GettingStarted({ viewer, t }: { viewer: Profile; t: Dictionary }) {
  if ((await cookies()).get(GETTING_STARTED_COOKIE)) return null;
  const supabase = await createClient();
  const [rated, entries, follows] = await Promise.all([
    supabase.from("entries").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).not("rating", "is", null),
    supabase.from("entries").select("id", { count: "exact", head: true }).eq("user_id", viewer.id),
    supabase.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", viewer.id),
  ]);
  const steps = [
    { key: "rate", done: (rated.count ?? 0) >= 5, title: t.onboarding.rate, hint: t.onboarding.rateHint, action: <StartQuickLog label={t.onboarding.start} /> },
    { key: "follow", done: (follows.count ?? 0) >= 3, title: t.onboarding.follow, hint: t.onboarding.followHint, href: "/search?type=people" },
    { key: "profile", done: !!viewer.avatar_url && !!viewer.bio, title: t.onboarding.profile, hint: t.onboarding.profileHint, href: "/settings" },
    // Quem já tem bastante coisa registrada não precisa importar
    { key: "import", done: (entries.count ?? 0) >= 20, title: t.onboarding.import, hint: t.onboarding.importHint, href: "/import" },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">{t.onboarding.title}</h2>
          <p className="text-xs text-muted">{t.onboarding.progress(done, steps.length)}</p>
        </div>
        <HideGettingStarted label={t.onboarding.hide} />
      </div>
      {/* Barra de progresso */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.key} className={`flex items-start gap-3 rounded-xl border border-border p-3 ${s.done ? "opacity-60" : ""}`}>
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                s.done ? "bg-ok text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${s.done ? "line-through" : ""}`}>{s.title}</p>
              <p className="text-xs text-muted">{s.hint}</p>
            </div>
            {!s.done &&
              (s.action ?? (
                <Link href={s.href!} className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-fg">
                  {t.onboarding.start}
                </Link>
              ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
