import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PopularList } from "@/lib/lists";
import { ListEditor } from "./list-editor";
import { ListCard } from "./list-card";
import { EmptyState } from "@/components/page-header";

// Grade de listas (aba Listas do perfil e Todas as listas): o "+ Nova lista" primeiro (para quem pode
// criar) e os cartões com a fileira de pôsteres, o nome, quem fez, obras e comentários.
export function ListsGrid({
  lists,
  canCreate,
  username,
  viewerId,
  t,
}: {
  lists: PopularList[];
  canCreate: boolean;
  username: string | null;
  viewerId: string | null;
  t: Dictionary;
}) {
  if (!lists.length && !canCreate) return <EmptyState>{t.lists.empty}</EmptyState>;
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {canCreate && username && <ListEditor username={username} variant="wide" />}
      {lists.map((list) => (
        <ListCard key={list.id} list={list} viewerId={viewerId} />
      ))}
    </div>
  );
}
