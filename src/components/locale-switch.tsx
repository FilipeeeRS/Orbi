"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import { LOCALE_NAMES, LOCALES } from "@/lib/i18n/dictionaries";
import { useI18n } from "./i18n";

export function LocaleSwitch() {
  const { locale, t } = useI18n();
  const [pending, start] = useTransition();

  return (
    <select
      aria-label={t.footer.language}
      value={locale}
      disabled={pending}
      onChange={(e) => start(() => setLocale(e.target.value))}
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted outline-none hover:text-fg focus:border-accent"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
