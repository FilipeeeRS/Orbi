"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";

export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    setError(null);
    if (password !== String(form.get("confirm"))) return setError(t.auth.passwordMismatch);

    setPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold">{t.auth.newPasswordTitle}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t.auth.newPassword}</span>
          <input
            required
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
          />
          <span className="mt-1 block text-xs text-muted">{t.auth.passwordHint}</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t.auth.confirmPassword}</span>
          <input
            required
            name="confirm"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {t.auth.savePassword}
        </button>
      </form>
    </div>
  );
}
