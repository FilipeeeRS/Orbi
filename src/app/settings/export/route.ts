import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/session";

// "Baixar meus dados" (portabilidade, LGPD art. 18): um JSON com tudo o que é da pessoa no Orbi.
// Usa o cliente admin, sempre filtrado pelo id de quem está logado, para não depender das regras de
// leitura de cada tabela (denúncias, por exemplo, não são legíveis pelo próprio autor).
const ITEM = "item:items(id, kind, source, external_id, title, year)";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return new Response(null, { status: 401 });
  const admin = createAdminClient();
  const id = viewer.id;

  // O Supabase devolve no máximo 1000 linhas por vez: busca em páginas até acabar.
  async function all(table: string, select: string, column: string) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await admin.from(table).select(select).eq(column, id).range(from, from + 999);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) return rows;
    }
  }

  const [account, entries, episodes, art, lists, reviewComments, reviewLikes, commentLikes, following, followers, listLikes, listComments, listSaves, reports, devices, addedItems] =
    await Promise.all([
      admin.auth.admin.getUserById(id),
      all("entries", `*, ${ITEM}`, "user_id"),
      all("episode_watches", `*, ${ITEM}`, "user_id"),
      all("item_art", `*, ${ITEM}`, "user_id"),
      all("lists", `*, list_items(*, ${ITEM})`, "user_id"),
      all("review_comments", "*", "user_id"),
      all("review_likes", "*", "user_id"),
      all("comment_likes", "*", "user_id"),
      all("follows", "created_at, profile:profiles!follows_followee_id_fkey(username)", "follower_id"),
      all("follows", "created_at, profile:profiles!follows_follower_id_fkey(username)", "followee_id"),
      all("list_likes", "*", "user_id"),
      all("list_comments", "*", "user_id"),
      all("list_saves", "*", "user_id"),
      all("reports", "*", "reporter_id"),
      all("user_devices", "*", "user_id"),
      all("items", "id, kind, title, year, created_at", "created_by"),
    ]);

  const user = account.data.user;
  const data = {
    exported_at: new Date().toISOString(),
    account: user && {
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      providers: user.app_metadata?.providers ?? [],
      accepted_terms: user.user_metadata?.accepted_terms ?? null,
    },
    profile: viewer,
    entries,
    episode_watches: episodes,
    item_art: art,
    lists,
    review_comments: reviewComments,
    review_likes: reviewLikes,
    comment_likes: commentLikes,
    following,
    followers,
    list_likes: listLikes,
    list_comments: listComments,
    list_saves: listSaves,
    reports,
    devices,
    items_added: addedItems,
  };

  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="orbi-${viewer.username}-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
