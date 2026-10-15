"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-xl font-bold">{t.errors.title}</h1>
      <p className="text-sm text-muted">{t.errors.body}</p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={() => retry()}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
        >
          {t.errors.retry}
        </button>
        <Link href="/" className="rounded-full border border-border px-5 py-2 text-sm hover:bg-surface-2">
          {t.errors.home}
        </Link>
      </div>
    </div>
  );
}
