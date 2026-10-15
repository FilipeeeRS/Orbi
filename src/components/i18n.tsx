"use client";

import { createContext, use, useEffect, type ReactNode } from "react";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

const LocaleContext = createContext<Locale>("pt");

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = dictionaries[locale].htmlLang;
    document.documentElement.dir = dictionaries[locale].dir;
  }, [locale]);
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useI18n() {
  const locale = use(LocaleContext);
  return { locale, t: dictionaries[locale] };
}
