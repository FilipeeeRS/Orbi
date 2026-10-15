-- Favoritos escolhidos pelo usuário para o topo do perfil (até 4, na ordem salva).
-- Vazio = o perfil mostra os curtidos mais recentes.
alter table public.profiles
  add column favorites uuid[] not null default '{}' check (cardinality(favorites) <= 4);
