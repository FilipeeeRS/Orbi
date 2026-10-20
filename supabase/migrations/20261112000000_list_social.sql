-- Curtidas e comentários em listas (contadores na Home; a lista em si continua com a mesma visibilidade).
create table public.list_likes (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index list_likes_user_idx on public.list_likes (user_id);

create table public.list_comments (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index list_comments_list_idx on public.list_comments (list_id, created_at);

alter table public.list_likes enable row level security;
alter table public.list_comments enable row level security;

create policy "list likes are public" on public.list_likes for select using (true);
create policy "users like lists as themselves" on public.list_likes for insert
  with check ((select auth.uid()) = user_id);
create policy "users unlike lists as themselves" on public.list_likes for delete
  using ((select auth.uid()) = user_id);

-- Aparecem para todos, menos quando o autor do comentário tem perfil invisível.
create policy "list comments visible unless private" on public.list_comments for select
  using (
    user_id = (select auth.uid())
    or not exists (select 1 from public.profiles p where p.id = list_comments.user_id and p.is_private)
  );
create policy "users comment lists as themselves" on public.list_comments for insert
  with check ((select auth.uid()) = user_id);
-- Apaga o próprio comentário; o dono da lista também pode apagar comentários na lista dele.
create policy "authors and list owners delete comments" on public.list_comments for delete
  using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.lists l where l.id = list_comments.list_id and l.user_id = (select auth.uid()))
  );
