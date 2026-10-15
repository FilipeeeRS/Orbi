-- Localização, pronomes, perfil invisível e conteúdo +18
alter table public.profiles
  add column location text check (char_length(location) <= 60),
  add column pronouns text check (char_length(pronouns) <= 30),
  add column is_private boolean not null default false,
  add column show_adult boolean not null default true; -- novos usuários já entram com +18 ativado

-- Filme com classificação 18 anos (ou equivalente) em algum país; null = ainda não verificado.
alter table public.items add column is_adult_rated boolean;

-- Perfil invisível: só o próprio dono enxerga o perfil e as entradas dele.
drop policy "profiles are public" on public.profiles;
create policy "profiles visible unless private" on public.profiles for select
  using (not is_private or id = (select auth.uid()));

drop policy "entries are public" on public.entries;
create policy "entries visible unless owner is private" on public.entries for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = entries.user_id and not p.is_private)
  );

-- Quem segue / é seguido por um perfil invisível também não aparece para terceiros.
drop policy "follows are public" on public.follows;
create policy "follows visible unless private" on public.follows for select
  using (
    (select auth.uid()) in (follower_id, followee_id)
    or not exists (
      select 1 from public.profiles p where p.id in (follower_id, followee_id) and p.is_private
    )
  );
