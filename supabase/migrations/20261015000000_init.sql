-- Orbi: schema inicial (perfis, catálogo de obras, entradas do usuário)

create type public.media_kind as enum ('movie', 'series', 'music', 'game', 'book');
create type public.entry_status as enum ('watched', 'watchlist');

-- Perfis -----------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  locale text check (locale in ('pt', 'en')),
  created_at timestamptz not null default now()
);

-- Catálogo compartilhado entre usuários. Só o servidor (secret key) escreve aqui.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  kind public.media_kind not null,
  source text not null,              -- 'tmdb', 'manual', e no futuro 'igdb', 'steam'...
  external_id text,
  title text not null,               -- título em inglês (ou original)
  title_pt text,
  original_title text,
  year int,
  overview text,
  overview_pt text,
  poster_url text,
  backdrop_url text,
  created_at timestamptz not null default now(),
  unique (kind, source, external_id)
);

-- Relação usuário x obra. Uma entrada por obra (sem rewatch).
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  status public.entry_status not null,
  rating smallint check (rating between 1 and 10), -- meias estrelas: 1 = ½★ ... 10 = 5★
  liked boolean not null default false,
  review text check (char_length(review) <= 20000),
  watched_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id),
  -- nota, like e review só existem em obras marcadas como vistas
  check (status = 'watched' or (rating is null and not liked and review is null))
);

create index entries_user_status_idx on public.entries (user_id, status, watched_on desc);
create index entries_item_idx on public.entries (item_id);

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

-- Cria o perfil automaticamente no cadastro (e-mail ou Google) ------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidate text;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_]', '', 'g');
  base := left(base, 24);
  if char_length(base) < 3 then
    base := base || 'orbi';
  end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base || floor(random() * 10000)::int;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url, locale)
  values (
    new.id,
    candidate,
    left(coalesce(meta ->> 'full_name', meta ->> 'name'), 60),
    meta ->> 'avatar_url',
    case when meta ->> 'locale' in ('pt', 'en') then meta ->> 'locale' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Segurança (RLS) ----------------------------------------------------------
-- Perfis e entradas são públicos para leitura; cada um só escreve o que é seu.

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.entries enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "items are public" on public.items for select using (true);

create policy "entries are public" on public.entries for select using (true);
create policy "users insert own entries" on public.entries for insert
  with check ((select auth.uid()) = user_id);
create policy "users update own entries" on public.entries for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own entries" on public.entries for delete
  using ((select auth.uid()) = user_id);
