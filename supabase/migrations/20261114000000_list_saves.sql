-- Listas salvas (o marcador): cada pessoa salva listas dos outros para ver depois.
create table public.list_saves (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index list_saves_user_idx on public.list_saves (user_id, created_at desc);

alter table public.list_saves enable row level security;

-- Só quem salvou vê o que salvou.
create policy "users see own saves" on public.list_saves for select using ((select auth.uid()) = user_id);
create policy "users save as themselves" on public.list_saves for insert with check ((select auth.uid()) = user_id);
create policy "users unsave as themselves" on public.list_saves for delete using ((select auth.uid()) = user_id);
