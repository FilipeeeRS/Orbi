-- Bordas: saem "white" e "black"; entra cor personalizada em hex (#rrggbb)
update public.profiles set avatar_ring = 'none' where avatar_ring in ('white', 'black');

alter table public.profiles drop constraint profiles_avatar_ring_check;
alter table public.profiles add constraint profiles_avatar_ring_check check (
  avatar_ring in ('none', 'theme', 'silver', 'obsidian', 'gold', 'rosegold', 'rainbow')
  or avatar_ring ~ '^#[0-9a-f]{6}$'
);
