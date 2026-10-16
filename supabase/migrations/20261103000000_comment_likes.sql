-- Curtidas em comentários de reviews: cada pessoa curte um comentário no máximo uma vez.
create table public.comment_likes (
  comment_id uuid not null references public.review_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index comment_likes_user_idx on public.comment_likes (user_id);

alter table public.comment_likes enable row level security;

create policy "comment likes are public" on public.comment_likes for select using (true);
create policy "users like comments as themselves" on public.comment_likes for insert
  with check ((select auth.uid()) = user_id);
create policy "users unlike comments as themselves" on public.comment_likes for delete
  using ((select auth.uid()) = user_id);
