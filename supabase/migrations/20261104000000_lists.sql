-- Listas personalizadas: nome, descrição e obras na ordem escolhida.
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lists_user_idx on public.lists (user_id, updated_at desc);

create table public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  position int not null,
  added_at timestamptz not null default now(),
  primary key (list_id, item_id)
);

create index list_items_order_idx on public.list_items (list_id, position);

create trigger lists_touch before update on public.lists
  for each row execute function public.touch_updated_at();

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Visíveis para todos, menos quando o dono tem perfil invisível.
create policy "lists visible unless owner is private" on public.lists for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = lists.user_id and not p.is_private)
  );
create policy "users create own lists" on public.lists for insert
  with check ((select auth.uid()) = user_id);
create policy "users update own lists" on public.lists for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own lists" on public.lists for delete
  using ((select auth.uid()) = user_id);

-- Itens seguem a lista: aparecem se a lista aparece; só o dono da lista mexe.
create policy "list items visible with their list" on public.list_items for select
  using (exists (select 1 from public.lists l where l.id = list_items.list_id));
create policy "owners add list items" on public.list_items for insert
  with check (exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = (select auth.uid())));
create policy "owners update list items" on public.list_items for update
  using (exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = (select auth.uid())));
create policy "owners remove list items" on public.list_items for delete
  using (exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = (select auth.uid())));
