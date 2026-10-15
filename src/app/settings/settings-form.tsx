"use client";

import { useActionState, useState, useTransition } from "react";
import { setAvatar, updateProfile, type ProfileFormState } from "@/app/actions";
import { Avatar } from "@/components/header";
import { useI18n } from "@/components/i18n";
import { createClient } from "@/lib/supabase/client";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent";
const MAX_BYTES = 5 * 1024 * 1024;

export function SettingsForm({ profile, locale }: { profile: Profile; locale: Locale }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, { status: "idle" });
  const message = {
    idle: null,
    taken: t.settings.usernameTaken,
    invalid: t.settings.invalid,
    error: t.common.error,
  }[state.status];

  return (
    <div className="space-y-6">
      <AvatarPicker profile={profile} />

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
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_NAMES[l]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-danger">{message}</span>
          <button
            disabled={pending}
            className="rounded-lg bg-accent px-5 py-2 font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
          >
            {t.settings.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function AvatarPicker({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) return setError(t.settings.avatarTooBig);

    start(async () => {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.id}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from("posters").upload(path, file, { contentType: file.type });
      if (error) return setError(error.message);
      const result = await setAvatar(path);
      if (!result.ok) setError(t.common.error);
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const result = await setAvatar(null);
      if (!result.ok) setError(t.common.error);
    });
  }

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-6 text-sm">
      <div className={pending ? "animate-pulse" : ""}>
        <Avatar profile={profile} size={80} />
      </div>
      <div className="space-y-2">
        <p className="font-semibold">{t.settings.avatar}</p>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2">
            {t.settings.avatarChange}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={pending}
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          {profile.avatar_url && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-fg"
            >
              {t.settings.avatarRemove}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{t.settings.avatarHint}</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
