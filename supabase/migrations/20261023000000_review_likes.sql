-- Likes em reviews: cada pessoa curte uma review no máximo uma vez (pode ser a própria).
create table public.review_likes (
  entry_id uuid not null references public.entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create index review_likes_user_idx on public.review_likes (user_id);

alter table public.review_likes enable row level security;

create policy "review likes are public" on public.review_likes for select using (true);
create policy "users like as themselves" on public.review_likes for insert
  with check ((select auth.uid()) = user_id);
create policy "users unlike as themselves" on public.review_likes for delete
  using ((select auth.uid()) = user_id);
