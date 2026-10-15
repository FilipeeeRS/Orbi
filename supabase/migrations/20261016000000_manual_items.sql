-- Filmes cadastrados manualmente + capas no Storage

alter table public.items add column created_by uuid references public.profiles (id) on delete set null;

-- Bucket público (leitura pela URL); cada usuário só envia arquivos para a pasta com o próprio id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posters', 'posters', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "users upload own posters" on storage.objects for insert to authenticated
  with check (bucket_id = 'posters' and (storage.foldername(name))[1] = (select auth.uid())::text);
