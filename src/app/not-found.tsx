import Link from "next/link";
import { getDict } from "@/lib/session";

export default async function NotFound() {
  const { t } = await getDict();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <p className="text-5xl font-bold text-accent">404</p>
      <h1 className="text-xl font-bold">{t.errors.notFoundTitle}</h1>
      <p className="text-sm text-muted">{t.errors.notFoundBody}</p>
      <Link href="/" className="mt-2 rounded-full border border-border px-5 py-2 text-sm hover:bg-surface-2">
        {t.errors.home}
      </Link>
    </div>
  );
}
