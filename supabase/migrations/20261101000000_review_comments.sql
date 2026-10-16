-- Comentários em reviews (estilo Twitter): a origem é sempre uma review (entries.id).
-- parent_id = resposta a outro comentário da mesma review (um nível de recuo na tela).
create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.review_comments (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index review_comments_entry_idx on public.review_comments (entry_id, created_at);

alter table public.review_comments enable row level security;

-- Aparecem para todos, menos quando o autor do comentário ou o dono da review tem perfil invisível.
create policy "review comments visible unless private" on public.review_comments for select
  using (
    user_id = (select auth.uid())
    or (
      not exists (select 1 from public.profiles p where p.id = review_comments.user_id and p.is_private)
      and exists (
        select 1 from public.entries e join public.profiles p on p.id = e.user_id
        where e.id = review_comments.entry_id and not p.is_private
      )
    )
  );

-- Só comenta como si mesmo, e só em reviews de verdade (com texto ou anexo).
create policy "users comment as themselves" on public.review_comments for insert
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.entries e where e.id = review_comments.entry_id and e.review is not null)
  );

-- Apaga o próprio comentário; o dono da review também pode apagar comentários na review dele.
create policy "authors and review owners delete comments" on public.review_comments for delete
  using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.entries e where e.id = review_comments.entry_id and e.user_id = (select auth.uid()))
  );
