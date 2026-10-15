"use client";

import { useActionState, useState, useTransition } from "react";
import { setAvatar, setCover, updateProfile, type FavoriteItem, type ProfileFormState } from "@/app/actions";
import { FavoritesEditor } from "./favorites-editor";
import { Avatar } from "@/components/header";
import { useI18n } from "@/components/i18n";
import { ThemeSelect } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent";
const MAX_BYTES = 5 * 1024 * 1024;
// Mesmas opções do Letterboxd.
const PRONOUNS = ["They / their", "He / his", "He / their", "She / her", "She / their", "Xe / xyr", "Ze / hir", "Ze / zir", "It / its"];

export function SettingsForm({ profile, locale, favorites }: { profile: Profile; locale: Locale; favorites: FavoriteItem[] }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, { status: "idle" });
  const message = {
    idle: null,
    taken: t.settings.usernameTaken,
    invalid: t.settings.invalid,
    error: t.common.error,
  }[state.status];

  // Duas colunas: campos de texto à esquerda, imagens (foto e capa) à direita.
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
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
          <span className="mb-1 block text-muted">{t.settings.location}</span>
          <input name="location" defaultValue={profile.location ?? ""} maxLength={60} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-muted">{t.settings.website}</span>
          <input
            name="website"
            type="text"
            inputMode="url"
            defaultValue={profile.website ?? ""}
            maxLength={200}
            placeholder="meusite.com"
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-muted">{t.settings.bio}</span>
          <textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={500} rows={4} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-muted">{t.settings.pronouns}</span>
          <select name="pronouns" defaultValue={profile.pronouns ?? ""} className={input}>
            <option value="">{t.settings.pronounsHint}</option>
            {/* Valor antigo digitado à mão continua aparecendo para não se perder */}
            {profile.pronouns && !PRONOUNS.includes(profile.pronouns) && (
              <option value={profile.pronouns}>{profile.pronouns}</option>
            )}
            {PRONOUNS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
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
        <label className="block">
          <span className="mb-1 block text-muted">{t.settings.theme}</span>
          {/* Aplica na hora e fica salvo neste navegador */}
          <ThemeSelect labels={{ dark: t.settings.themeDark, light: t.settings.themeLight }} className={input} />
        </label>
        <Checkbox name="show_adult" defaultChecked={profile.show_adult} label={t.settings.adult} hint={t.settings.adultHint} />
        <Checkbox
          name="is_private"
          defaultChecked={profile.is_private}
          label={t.settings.privateProfile}
          hint={t.settings.privateHint}
        />
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

      <div className="space-y-6">
        <AvatarPicker profile={profile} />
        <CoverPicker profile={profile} />
        <FavoritesEditor key={favorites.map((f) => f.id).join()} initial={favorites} />
      </div>
    </div>
  );
}

function Checkbox({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--accent)]" />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
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
      <p className="text-xs text-muted">{t.settings.coverHint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 whitespace-nowrap hover:bg-surface-2">
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
      <div className="min-w-0 space-y-2">
        <p className="font-semibold">{t.settings.avatar}</p>
        <div className="flex gap-2 whitespace-nowrap">
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
