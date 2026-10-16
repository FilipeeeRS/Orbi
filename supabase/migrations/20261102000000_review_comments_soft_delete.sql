-- Apagar comentário com respostas: vira "Comentário apagado" (texto some, respostas ficam).
-- Sem respostas: some de vez. Um apagado que fica sem respostas também some.
alter table public.review_comments add column deleted_at timestamptz;

alter table public.review_comments drop constraint review_comments_body_check;
alter table public.review_comments add constraint review_comments_body_check
  check (deleted_at is not null or char_length(trim(body)) between 1 and 2000);

-- Quem pode apagar: o autor do comentário ou o dono da review. Retorna 'soft', 'hard' ou null (sem permissão).
create or replace function public.delete_review_comment(comment_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  c public.review_comments;
  review_owner uuid;
begin
  select * into c from public.review_comments where id = comment_id;
  if not found then return null; end if;
  select user_id into review_owner from public.entries where id = c.entry_id;
  if auth.uid() is null or (auth.uid() <> c.user_id and auth.uid() is distinct from review_owner) then
    return null;
  end if;

  if exists (select 1 from public.review_comments where parent_id = c.id) then
    update public.review_comments set deleted_at = now(), body = '' where id = c.id;
    return 'soft';
  end if;

  delete from public.review_comments where id = c.id;
  -- O comentário de origem já apagado e agora sem respostas some também.
  if c.parent_id is not null then
    delete from public.review_comments p
    where p.id = c.parent_id and p.deleted_at is not null
      and not exists (select 1 from public.review_comments r where r.parent_id = p.id);
  end if;
  return 'hard';
end;
$$;

grant execute on function public.delete_review_comment(uuid) to authenticated;
