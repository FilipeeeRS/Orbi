"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { setAvatar, setAvatarRing, setCover, setSticker, setLocale, updateProfile, type FavoriteItem, type ProfileFormState } from "@/app/actions";
import { FavoritesEditor } from "./favorites-editor";
import { Avatar } from "@/components/avatar";
import { useI18n } from "@/components/i18n";
import { ThemeSelect } from "@/components/theme-toggle";
import { ColorPicker } from "@/components/color-picker";
import { createClient } from "@/lib/supabase/client";
import { LOCALE_NAMES, LOCALES_ALPHABETICAL } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";
import { AVATAR_RINGS, isAvatarRing, isCustomRing, ringBackground, type AvatarRing } from "@/lib/avatar-ring";

const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent";
const MAX_BYTES = 5 * 1024 * 1024;
// Mesmas opções do Letterboxd.
const PRONOUNS = ["They / their", "He / his", "He / their", "She / her", "She / their", "Xe / xyr", "Ze / hir", "Ze / zir", "It / its"];

export function SettingsForm({ profile, favorites }: { profile: Profile; favorites: FavoriteItem[] }) {
  const { t, locale: uiLocale } = useI18n();
  const [localePending, startLocale] = useTransition();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, { status: "idle" });
  const message = {
    idle: null,
    taken: t.settings.usernameTaken,
    invalid: t.settings.invalid,
    error: t.common.error,
  }[state.status];

  // Duas colunas: campos de texto e senha à esquerda, imagens (foto e capa) à direita.
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
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
            {/* Mostra o idioma em uso na tela e troca na hora (igual ao seletor do rodapé) */}
            <select
              name="locale"
              value={uiLocale}
              disabled={localePending}
              onChange={(e) => startLocale(() => setLocale(e.target.value))}
              className={input}
            >
              {LOCALES_ALPHABETICAL.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
          <div className="block">
            <span className="mb-1 block text-muted">{t.settings.theme}</span>
            {/* Aplica na hora e fica salvo neste navegador */}
            <ThemeSelect
              labels={{
                dark: t.settings.themeDark,
                light: t.settings.themeLight,
                fire: t.settings.themeFire,
                purple: t.settings.themePurple,
                pink: t.settings.themePink,
                ocean: t.settings.themeOcean,
                forest: t.settings.themeForest,
                sunset: t.settings.themeSunset,
                custom: t.settings.themeCustom,
                customBorder: t.settings.themeCustomBorder,
                customBg: t.settings.themeCustomBg,
              }}
              className={input}
            />
          </div>
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
        <PasswordForm />
      </div>

      <div className="space-y-6">
        <AvatarPicker profile={profile} />
        <CoverPicker profile={profile} />
        <StickerPicker profile={profile} />
        <FavoritesEditor key={favorites.map((f) => f.id).join()} initial={favorites} />
      </div>
    </div>
  );
}

// Senha: por segurança a troca é feita por e-mail. Enviamos um link de redefinição para o e-mail da conta;
// ele passa pelo /auth/callback e cai em /reset-password, onde a pessoa cria a senha nova.
function PasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function send() {
    if (!email) return;
    setPending(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    setPending(false);
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 text-sm">
      <p className="font-semibold">{t.settings.password}</p>
      <p className="text-muted">{email ? t.settings.passwordHint(maskEmail(email)) : "…"}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs ${status === "sent" ? "text-ok" : "text-danger"}`}>
          {status === "sent" && email ? t.settings.passwordSent(maskEmail(email)) : error}
        </span>
        <button
          type="button"
          onClick={send}
          disabled={pending || !email}
          className="shrink-0 rounded-lg bg-accent px-5 py-2 font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {status === "sent" ? t.settings.passwordResend : t.settings.passwordSend}
        </button>
      </div>
    </div>
  );
}

// "filiperibeirosimoes@gmail.com" → "fi****************@gmail.com"
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(name.length - 2, 8)))}@${domain}`;
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
function useProfileImage(profileId: string, kind: "avatar" | "cover" | "sticker") {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = { avatar: setAvatar, cover: setCover, sticker: setSticker }[kind];

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

// Sticker: PNG/WebP sem fundo; a prévia usa um xadrez para mostrar onde é transparente.
function StickerPicker({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const { pending, error, upload, remove } = useProfileImage(profile.id, "sticker");

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 text-sm">
      <p className="font-semibold">{t.settings.sticker}</p>
      <div
        className={`grid h-32 place-items-center rounded-xl border border-border ${pending ? "animate-pulse" : ""}`}
        style={{
          backgroundColor: "var(--surface-2)",
          backgroundImage:
            "linear-gradient(45deg, var(--border) 25%, transparent 25%, transparent 75%, var(--border) 75%), linear-gradient(45deg, var(--border) 25%, transparent 25%, transparent 75%, var(--border) 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      >
        {profile.sticker_url && (
          // eslint-disable-next-line @next/next/no-img-element -- prévia simples de imagem do Storage
          <img src={profile.sticker_url} alt="" className="max-h-28 max-w-[80%] object-contain drop-shadow-lg" />
        )}
      </div>
      <p className="text-xs text-muted">{t.settings.stickerHint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2">
          {t.settings.stickerChange}
          <input
            type="file"
            accept="image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
        {profile.sticker_url && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          >
            {t.settings.stickerRemove}
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
  // A prévia muda na hora; o servidor grava em segundo plano e volta atrás se falhar.
  const [ring, setRing] = useState<AvatarRing>(isAvatarRing(profile.avatar_ring) ? profile.avatar_ring : "none");
  const [ringError, setRingError] = useState(false);
  const [, startRing] = useTransition();
  // Cor personalizada: a paleta dispara a cada movimento, então só grava quando a pessoa para.
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const custom = isCustomRing(ring) ? ring : "#ff3b52";

  function pickRing(next: AvatarRing, delay = 0) {
    const previous = ring;
    setRing(next);
    setRingError(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startRing(async () => {
        const { ok } = await setAvatarRing(next);
        if (!ok) {
          setRing(previous);
          setRingError(true);
        }
      });
    }, delay);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 text-sm">
      <div className="flex items-center gap-5">
        <div className={pending ? "animate-pulse" : ""}>
          <Avatar profile={profile} size={80} ring={ring} />
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

      <fieldset className="space-y-2">
        <legend className="mb-2 flex w-full justify-between gap-2">
          <span className="font-semibold">{t.settings.avatarRing}</span>
          <span className="text-muted">{isCustomRing(ring) ? t.settings.rings.custom : t.settings.rings[ring]}</span>
        </legend>
        {/* As 8 opções numa linha só, espalhadas pela largura do cartão */}
        <div className="flex items-center justify-between gap-1">
          {AVATAR_RINGS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pickRing(r)}
              aria-label={t.settings.rings[r]}
              aria-pressed={r === ring}
              title={t.settings.rings[r]}
              className={`grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-surface transition ${
                r === ring ? "ring-2 ring-fg" : "hover:ring-2 hover:ring-border"
              }`}
            >
              {r === "none" ? (
                <span className="grid size-7 place-items-center rounded-full border border-dashed border-muted text-muted">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M6 18 18 6" />
                  </svg>
                </span>
              ) : (
                <span className="size-7 rounded-full" style={{ background: ringBackground(r) ?? undefined }} />
              )}
            </button>
          ))}
          {/* Última opção: abre a paleta para escolher qualquer cor */}
          <ColorPicker
            value={custom}
            onChange={(hex) => pickRing(hex as AvatarRing, 400)}
            label={t.settings.rings.custom}
            align="end"
            className={`grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-surface transition ${
              isCustomRing(ring) ? "ring-2 ring-fg" : "hover:ring-2 hover:ring-border"
            }`}
          >
            <span
              className="grid size-7 place-items-center rounded-full ring-1 ring-border"
              style={{
                background: isCustomRing(ring)
                  ? ring
                  : "conic-gradient(from 90deg, #ff3b52, #ffd23f, #22c55e, #3b9eff, #a855f7, #ff3b52)",
              }}
            >
              {!isCustomRing(ring) && (
                <span className="grid size-4 place-items-center rounded-full bg-surface text-fg">
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              )}
            </span>
          </ColorPicker>
        </div>
        {ringError && <p className="text-xs text-danger">{t.common.error}</p>}
      </fieldset>
    </div>
  );
}
