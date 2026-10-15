-- Amigos no estilo Letterboxd: seguir é unilateral, sem pedido de aprovação.
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "follows are public" on public.follows for select using (true);
create policy "users follow as themselves" on public.follows for insert
  with check ((select auth.uid()) = follower_id);
create policy "users unfollow as themselves" on public.follows for delete
  using ((select auth.uid()) = follower_id);
