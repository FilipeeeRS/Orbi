-- Nova pasta: animes (separada das séries).
alter type public.media_kind add value if not exists 'anime' after 'series';
