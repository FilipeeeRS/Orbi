-- "Assistindo": em que temporada e episódio a pessoa parou.
alter table public.entries
  add column current_season smallint check (current_season >= 0),
  add column current_episode smallint check (current_episode >= 0);
