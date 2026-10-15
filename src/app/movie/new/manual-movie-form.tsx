"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";
import { PosterImage } from "@/components/poster";
import { createManualMovie } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;
const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent";

export function ManualMovieForm({ userId, initialTitle }: { userId: string; initialTitle: string }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initialTitle);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(f: File | undefined) {
    setError(null);
    if (f && f.size > MAX_BYTES) return setError(t.manual.tooBig);
    setFile(f ?? null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);

    let posterPath: string | null = null;
    if (file) {
      setStatus("uploading");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      posterPath = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from("posters").upload(posterPath, file, { contentType: file.type });
      if (error) {
        setStatus("idle");
        return setError(error.message);
      }
    }

    setStatus("saving");
    // Em caso de sucesso a action redireciona para a página do filme.
    const result = await createManualMovie({
      title,
      year: String(form.get("year") ?? ""),
      overview: String(form.get("overview") ?? ""),
      posterPath,
    });
    if (!result) return;
    setStatus("idle");
    setError(result.error === "invalid" ? t.manual.invalid : t.common.error);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 rounded-2xl border border-border bg-surface p-6 text-sm sm:grid-cols-[160px_1fr]">
      <div className="space-y-2">
        <span className="block text-muted">{t.manual.poster}</span>
        <label className="group block cursor-pointer">
          <PosterImage url={preview} title={title || "?"} />
          <span className="mt-2 block text-center text-xs text-accent group-hover:underline">{t.manual.choose}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        <span className="block text-xs text-muted">{t.manual.posterHint}</span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-muted">{t.manual.name}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-muted">{t.manual.year}</span>
          <input name="year" type="number" min={1870} max={2100} className={`${input} max-w-32`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-muted">{t.manual.overview}</span>
          <textarea name="overview" rows={4} maxLength={5000} className={input} />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-danger">{error}</span>
          <button
            disabled={status !== "idle"}
            className="rounded-lg bg-accent px-5 py-2 font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
          >
            {status === "uploading" ? t.manual.uploading : status === "saving" ? t.common.loading : t.manual.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
