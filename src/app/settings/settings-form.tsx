"use client";

import { useActionState, useState, useTransition } from "react";
import { setAvatar, setCover, updateProfile, type ProfileFormState } from "@/app/actions";
import { Avatar } from "@/components/header";
import { useI18n } from "@/components/i18n";
import { ThemeSelect } from "@/components/theme-toggle";
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
      <CoverPicker profile={profile} />

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
          <span className="mb-1 block text-muted">{t.settings.theme}</span>
          {/* Aplica na hora e fica salvo neste navegador */}
          <ThemeSelect labels={{ dark: t.settings.themeDark, light: t.settings.themeLight }} className={input} />
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

// Envia a imagem para a pasta do usuário no Storage e grava a URL no perfil (foto ou capa).
function useProfileImage(profileId: string, kind: "avatar" | "cover") {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = kind === "avatar" ? setAvatar : setCover;

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) return setError(t.settings.avatarTooBig);

    start(async () => {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${profileId}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from("posters").upload(path, file, { contentType: file.type });
      if (error) return setError(error.message);
      const result = await save(path);
      if (!result.ok) setError(t.common.error);
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const result = await save(null);
      if (!result.ok) setError(t.common.error);
    });
  }

  return { pending, error, upload, remove };
}

function CoverPicker({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const { pending, error, upload, remove } = useProfileImage(profile.id, "cover");

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 text-sm">
      <p className="font-semibold">{t.settings.cover}</p>
      <div
        className={`relative h-28 overflow-hidden rounded-xl border border-border bg-surface-2 ${pending ? "animate-pulse" : ""}`}
      >
        {profile.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element -- prévia simples de imagem do Storage
          <img src={profile.cover_url} alt="" className="size-full object-cover" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2">
          {t.settings.coverChange}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
        {profile.cover_url && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          >
            {t.settings.coverRemove}
          </button>
        )}
      </div>
      <p className="text-xs text-muted">{t.settings.coverHint}</p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function AvatarPicker({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const { pending, error, upload, remove } = useProfileImage(profile.id, "avatar");

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
