"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";
import { setLocale } from "@/app/actions";
import { LOCALE_NAMES, LOCALES } from "@/lib/i18n/dictionaries";

export function LoginForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(params.get("error") ? t.common.error : null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startLocale] = useTransition();

  const supabase = createClient();
  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setError(null);
    setInfo(null);
    if (mode === "signup" && password !== String(form.get("confirm"))) {
      setError(t.auth.passwordMismatch);
      return;
    }
    setPending(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // O gatilho do banco usa full_name e locale para montar o perfil.
        options: {
          emailRedirectTo: callbackUrl(),
          data: { full_name: String(form.get("name")).trim(), locale: String(form.get("locale")) },
        },
      });
      setPending(false);
      if (error) return setError(error.message);
      if (data.session) {
        router.replace(next);
        router.refresh();
      } else {
        setInfo(t.auth.checkEmail);
      }
    }
  }

  async function google() {
    setPending(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold">{mode === "signin" ? t.auth.signInTitle : t.auth.signUpTitle}</h1>

      <button
        type="button"
        onClick={google}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {t.auth.google}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        {t.auth.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form key={mode} onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && <Field label={t.auth.name} name="name" maxLength={60} autoComplete="name" />}
        <Field label={t.auth.email} name="email" type="email" autoComplete="email" />
        <Field
          label={t.auth.password}
          name="password"
          type="password"
          minLength={8}
          hint={mode === "signup" ? t.auth.passwordHint : undefined}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        {mode === "signup" && (
          <>
            <Field label={t.auth.confirmPassword} name="confirm" type="password" minLength={8} autoComplete="new-password" />
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.settings.language}</span>
              {/* Trocar aqui já muda o idioma da tela; depois fica salvo no perfil */}
              <select
                name="locale"
                defaultValue={locale}
                onChange={(e) => startLocale(() => setLocale(e.target.value))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_NAMES[l]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-ok">{info}</p>}
        <button
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {mode === "signin" ? t.auth.signIn : t.auth.signUp}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setInfo(null);
        }}
        className="mt-4 w-full text-center text-sm text-muted hover:text-fg"
      >
        {mode === "signin" ? t.auth.toSignUp : t.auth.toSignIn}
      </button>
    </div>
  );
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <input
        required
        {...props}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// Só aceita caminhos internos, para não virar redirecionamento aberto.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
