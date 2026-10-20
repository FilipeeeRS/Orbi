-- "Assistindo": status de série/temporada em andamento (sem nota, like ou review, como a watchlist).
alter type public.entry_status add value if not exists 'watching';
