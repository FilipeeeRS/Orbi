-- Anexos nas reviews: imagens, GIFs, PDF, Word e vídeos curtos (até 4 por review, 25 MB cada).
-- Os arquivos ficam no bucket público "review-files", na pasta do próprio usuário.
alter table public.entries
  add column attachments jsonb not null default '[]'::jsonb
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 4);

-- Como nota, like e review: anexos só existem em obras marcadas como vistas.
alter table public.entries
  add constraint entries_attachments_watched check (status = 'watched' or attachments = '[]'::jsonb);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-files',
  'review-files',
  true,
  26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
);

create policy "users upload own review files" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete own review files" on storage.objects for delete to authenticated
  using (bucket_id = 'review-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
