-- Nota média do TMDB, para ordenar por "mais bem avaliados"
alter table public.items add column tmdb_rating numeric(3, 1);
alter table public.items add column tmdb_votes int;
