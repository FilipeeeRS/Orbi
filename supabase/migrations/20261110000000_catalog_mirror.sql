-- Cópia do catálogo no próprio banco (começando por animes e mangás do AniList): as listagens,
-- a temporada e a busca leem daqui, sem depender da API a cada visita.

create extension if not exists pg_trgm;

alter table public.items
  add column mal_id int,                 -- id no MyAnimeList (para links e uma troca futura de fonte)
  add column format text,                -- TV, MOVIE, OVA, ONA, MANGA, NOVEL, ONE_SHOT...
  add column status text,                -- FINISHED, RELEASING, NOT_YET_RELEASED...
  add column season text,                -- WINTER, SPRING, SUMMER, FALL (anime)
  add column season_year int,
  add column genres text[] not null default '{}', -- gêneros por nome (AniList)
  add column chapters int,               -- mangá
  add column volumes int,                -- mangá
  add column source_updated_at timestamptz; -- última atualização na fonte (sincronização incremental)

-- Temporada de anime, ordenada por popularidade (tmdb_votes guarda a popularidade da fonte).
create index items_season_idx on public.items (kind, season_year, season, tmdb_votes desc);
-- Listagens por popularidade e nota.
create index items_kind_popularity_idx on public.items (kind, tmdb_votes desc);
create index items_kind_score_idx on public.items (kind, tmdb_rating desc nulls last);
create index items_genres_idx on public.items using gin (genres);

-- Busca por título tolerante a erro de digitação ("atack on titan").
create index items_title_trgm_idx on public.items using gin (lower(title) gin_trgm_ops);
create index items_original_title_trgm_idx on public.items using gin (lower(original_title) gin_trgm_ops);

-- Busca de animes/mangás por semelhança, chamada pelo site (RPC). Junta o título e o original.
create or replace function public.search_catalog(q text, kinds public.media_kind[], max_results int default 20)
returns setof public.items
language sql stable
set search_path = public
as $$
  select i.*
  from public.items i
  where i.kind = any(kinds)
    and (lower(i.title) % lower(q) or lower(i.original_title) % lower(q)
         or lower(i.title) like '%' || lower(q) || '%' or lower(i.original_title) like '%' || lower(q) || '%')
  order by greatest(similarity(lower(i.title), lower(q)), similarity(coalesce(lower(i.original_title), ''), lower(q))) desc,
           i.tmdb_votes desc nulls last
  limit max_results;
$$;

-- Estado da sincronização (até onde cada importação já chegou).
create table public.sync_state (
  key text primary key,          -- ex.: 'anilist:ANIME'
  cursor int not null default 0, -- última página importada
  synced_at timestamptz          -- última sincronização completa
);
alter table public.sync_state enable row level security; -- só o servidor (secret key) mexe aqui
