-- Site pessoal no perfil (sempre http/https; validado também no servidor)
alter table public.profiles
  add column website text check (char_length(website) <= 200 and website ~* '^https?://');
