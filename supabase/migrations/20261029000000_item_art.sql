-- Pôster e fundo escolhidos pelo usuário para uma obra (entre as imagens do TMDB).
-- Guarda só o caminho do arquivo no TMDB ("/abc123.jpg"); a URL é montada no servidor.
create table public.item_art (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  poster_path text check (poster_path ~ '^/[A-Za-z0-9_-]+\.(jpg|png)$'),
  backdrop_path text check (backdrop_path ~ '^/[A-Za-z0-9_-]+\.(jpg|png)$'),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.item_art enable row level security;

-- Mesma regra das entradas: aparece para todos, menos quando o dono tem perfil invisível.
create policy "item art visible unless owner is private" on public.item_art for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = item_art.user_id and not p.is_private)
  );
create policy "users insert own item art" on public.item_art for insert
  with check ((select auth.uid()) = user_id);
create policy "users update own item art" on public.item_art for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own item art" on public.item_art for delete
  using ((select auth.uid()) = user_id);
