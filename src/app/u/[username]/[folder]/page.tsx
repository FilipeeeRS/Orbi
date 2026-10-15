import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Loading from "../../../loading";
import { FolderIcon } from "@/components/folder-icon";
import { getDict, getViewer } from "@/lib/session";
import { getProfileByUsername } from "@/lib/queries";
import type { MediaKind } from "@/lib/types";

// Pastas que ainda não têm conteúdo (filmes têm a própria página em /movies).
const FOLDER_SLUGS: Record<string, MediaKind> = {
  series: "series",
  music: "music",
  games: "game",
  books: "book",
};

export default function FolderPage(props: PageProps<"/u/[username]/[folder]">) {
  return (
    <Suspense fallback={<Loading />}>
      <FolderPageContent {...props} />
    </Suspense>
  );
}

async function FolderPageContent({ params }: PageProps<"/u/[username]/[folder]">) {
  const { username, folder } = await params;
  const kind = FOLDER_SLUGS[folder];
  if (!kind) notFound();

  const [profile, viewer, { t }] = await Promise.all([getProfileByUsername(username), getViewer(), getDict()]);
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${profile.username}`}
            aria-label={t.nav.profile}
            className="flex items-center gap-1 rounded-full p-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {viewer?.id !== profile.id && <span className="pe-1">@{profile.username}</span>}
          </Link>
          <h1 className="font-display text-2xl font-extrabold">{t.folders[kind]}</h1>
        </div>
        <span className="text-sm text-muted">{t.profile.items(0)}</span>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-20 text-center">
        <FolderIcon kind={kind} className="size-12 text-accent/80" />
        <p className="font-display text-lg font-bold">{t.folders.soon}</p>
        <p className="text-sm text-muted">{t.profile.empty}</p>
      </div>
    </div>
  );
}
