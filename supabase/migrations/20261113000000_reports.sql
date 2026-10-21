-- Denúncias de reviews, comentários, listas e comentários de listas. Quem denunciou só vê as próprias;
-- a análise é feita pelo painel do Supabase (tabela reports).
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('review', 'review_comment', 'list', 'list_comment')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'offensive', 'harassment', 'spoiler', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index reports_open_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "users see own reports" on public.reports for select
  using ((select auth.uid()) = reporter_id);
create policy "users report as themselves" on public.reports for insert
  with check ((select auth.uid()) = reporter_id);
