-- Borda da foto de perfil escolhida pelo usuário ('none' = sem borda; 'theme' = cor de destaque do tema)
alter table public.profiles
  add column avatar_ring text not null default 'none'
  check (avatar_ring in ('none', 'theme', 'white', 'black', 'silver', 'obsidian', 'gold', 'rosegold', 'rainbow'));
