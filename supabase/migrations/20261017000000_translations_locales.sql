-- Traduções dos títulos/sinopses em um único campo e mais idiomas no perfil

alter table public.items add column translations jsonb not null default '{}'::jsonb;

-- Formato: {"pt": {"title": "...", "overview": "..."}, "es": {...}}
update public.items
set translations = jsonb_build_object('pt', jsonb_strip_nulls(jsonb_build_object('title', title_pt, 'overview', overview_pt)))
where title_pt is not null or overview_pt is not null;

alter table public.items drop column title_pt, drop column overview_pt;

alter table public.profiles drop constraint profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('pt', 'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'ur', 'id', 'de', 'ja', 'tr', 'ko', 'it'));

-- O trigger de cadastro passa a aceitar os novos idiomas
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidate text;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_]', '', 'g');
  base := left(base, 24);
  if char_length(base) < 3 then
    base := base || 'orbi';
  end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base || floor(random() * 10000)::int;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url, locale)
  values (
    new.id,
    candidate,
    left(coalesce(meta ->> 'full_name', meta ->> 'name'), 60),
    meta ->> 'avatar_url',
    case when meta ->> 'locale' in ('pt', 'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'ur', 'id', 'de', 'ja', 'tr', 'ko', 'it') then meta ->> 'locale' end
  );
  return new;
end;
$$;
