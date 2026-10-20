-- Aparelhos/navegadores em que a conta já entrou: um novo vira notificação ("Novo acesso: Chrome no Windows").
create table public.user_devices (
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_key text not null,      -- navegador + sistema (ex.: "chrome-windows")
  label text not null,           -- como aparece na notificação (ex.: "Chrome no Windows")
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, device_key)
);

alter table public.user_devices enable row level security;

create policy "users see own devices" on public.user_devices for select
  using ((select auth.uid()) = user_id);
create policy "users add own devices" on public.user_devices for insert
  with check ((select auth.uid()) = user_id);
create policy "users update own devices" on public.user_devices for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
