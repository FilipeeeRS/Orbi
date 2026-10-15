"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/session";

export type ManualMovieInput = { title: string; year: string; overview: string; posterPath: string | null };

export async function createManualMovie(input: ManualMovieInput): Promise<{ error: "invalid" | "error" }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "error" };

  const title = input.title.trim().slice(0, 300);
  const year = input.year.trim() ? Number(input.year) : null;
  const overview = input.overview.trim().slice(0, 5000) || null;
  if (!title || (year !== null && !(Number.isInteger(year) && year >= 1870 && year <= 2100))) {
    return { error: "invalid" };
  }

  const admin = createAdminClient();
  // A capa só vale se estiver na pasta do próprio usuário (a policy do Storage já garante o upload).
  const posterPath = input.posterPath?.startsWith(`${viewer.id}/`) ? input.posterPath : null;
  const posterUrl = posterPath ? admin.storage.from("posters").getPublicUrl(posterPath).data.publicUrl : null;

  const { data, error } = await admin
    .from("items")
    .insert({
      kind: "movie",
      source: "manual",
      title,
      year,
      overview,
      overview_pt: overview,
      poster_url: posterUrl,
      created_by: viewer.id,
    })
    .select("id")
    .single();
  if (error) return { error: "error" };

  redirect(`/movie/${data.id}`);
}
