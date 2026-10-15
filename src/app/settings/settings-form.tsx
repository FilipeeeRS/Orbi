"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateProfile, type ProfileFormState } from "@/app/actions";
import { useI18n } from "@/components/i18n";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent";

export function SettingsForm({ profile, locale }: { profile: Profile; locale: Locale }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, { status: "idle" });
  const message = {
    idle: null,
    saved: t.settings.saved,
    taken: t.settings.usernameTaken,
    invalid: t.settings.invalid,
    error: t.common.error,
  }[state.status];

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-surface p-6 text-sm">
      <label className="block">
        <span className="mb-1 block text-muted">{t.settings.username}</span>
        <input
          name="username"
          defaultValue={profile.username}
          required
          pattern="[a-z0-9_]{3,30}"
          className={input}
        />
        <span className="mt-1 block text-xs text-muted">{t.settings.usernameHint}</span>
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">{t.settings.displayName}</span>
        <input name="display_name" defaultValue={profile.display_name ?? ""} maxLength={60} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">{t.settings.bio}</span>
        <textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={500} rows={3} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">{t.settings.language}</span>
        <select name="locale" defaultValue={locale} className={input}>
          <option value="pt">Português</option>
          <option value="en">English</option>
        </select>
      </label>
      <div className="flex items-center justify-between gap-3">
        <span className={state.status === "saved" ? "text-ok" : "text-like"}>
          {message}{" "}
          {state.status === "saved" && state.username && (
            <Link href={`/u/${state.username}`} className="underline">
              /u/{state.username}
            </Link>
          )}
        </span>
        <button
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-2 font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {t.settings.save}
        </button>
      </div>
    </form>
  );
}
