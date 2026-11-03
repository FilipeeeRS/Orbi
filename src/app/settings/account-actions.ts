"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/session";

// Apaga todos os arquivos de uma pasta do Storage que passam no filtro (a listagem vem em páginas de 1000).
async function removeFolder(bucket: string, folder: string, keep: (name: string) => boolean = () => false) {
  const storage = createAdminClient().storage.from(bucket);
  for (let offset = 0; ; ) {
    const { data } = await storage.list(folder, { limit: 1000, offset });
    if (!data?.length) return;
    const remove = data.filter((f) => !keep(f.name)).map((f) => `${folder}/${f.name}`);
    if (remove.length) await storage.remove(remove);
    // O que ficou (mantido) continua na listagem: pula para depois dele
    offset += data.length - remove.length;
    if (data.length < 1000) return;
  }
}

// Excluir conta (LGPD art. 18): a pessoa confirma digitando o próprio @. Apaga as fotos do perfil e os
// anexos das reviews e depois o usuário; o banco apaga em cascata perfil, registros, listas, reviews,
// comentários, curtidas, seguidores, denúncias e aparelhos. Filmes adicionados à mão ficam no catálogo,
// sem autor (o pôster deles fica junto).
export async function deleteAccount(confirm: string): Promise<{ ok: false }> {
  const viewer = await getViewer();
  if (!viewer || confirm.trim().replace(/^@/, "").toLowerCase() !== viewer.username.toLowerCase()) return { ok: false };

  await Promise.all([
    removeFolder("review-files", viewer.id),
    removeFolder("posters", viewer.id, (name) => !/^(avatar|cover|sticker)-/.test(name)),
  ]);
  const { error } = await createAdminClient().auth.admin.deleteUser(viewer.id);
  if (error) return { ok: false };

  await (await createClient()).auth.signOut();
  (await cookies()).delete("orbi-device");
  redirect("/");
}
