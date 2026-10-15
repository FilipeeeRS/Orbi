-- Dados do filme usados nos filtros e na ordenação das pastas
alter table public.items
  add column genre_ids int[] not null default '{}', -- ids de gênero do TMDB
  add column runtime int,                            -- duração em minutos
  add column release_date date;                      -- data de lançamento (o ano continua em "year")

create index items_genre_ids_idx on public.items using gin (genre_ids);
