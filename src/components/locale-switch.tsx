"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import { LOCALES } from "@/lib/i18n/dictionaries";
import { useI18n } from "./i18n";

export function LocaleSwitch() {
  const { locale, t } = useI18n();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2" aria-label={t.footer.language}>
      {LOCALES.map((l) => (
        <button
          key={l}
          disabled={pending || l === locale}
          onClick={() => start(() => setLocale(l))}
          className="uppercase disabled:cursor-default enabled:hover:text-fg data-[on=true]:font-semibold data-[on=true]:text-fg"
          data-on={l === locale}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
