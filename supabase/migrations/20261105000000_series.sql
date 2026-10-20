-- Séries: a série e cada temporada são itens (com nota, like e review);
-- episódios não viram item, só marcam "assistido" dentro da temporada.

alter type public.media_kind add value if not exists 'season';

alter table public.items
  add column parent_id uuid references public.items (id) on delete cascade, -- temporada → série
  add column season_number int,
  add column episode_count int;

create index items_parent_idx on public.items (parent_id, season_number);

create table public.episode_watches (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade, -- a temporada
  episode_number int not null check (episode_number >= 0),
  watched_on date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id, episode_number)
);

alter table public.episode_watches enable row level security;

-- Mesma regra das entradas: público, menos de perfil invisível; cada um só mexe nos seus.
create policy "episode watches visible unless owner is private" on public.episode_watches for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = episode_watches.user_id and not p.is_private)
  );
create policy "users insert own episode watches" on public.episode_watches for insert
  with check ((select auth.uid()) = user_id);
create policy "users delete own episode watches" on public.episode_watches for delete
  using ((select auth.uid()) = user_id);
