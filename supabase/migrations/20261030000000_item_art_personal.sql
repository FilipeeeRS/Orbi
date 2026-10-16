-- Pôster/fundo escolhidos são pessoais (só o dono vê) e só valem para obras que a pessoa já viu.
drop policy "item art visible unless owner is private" on public.item_art;
create policy "users see own item art" on public.item_art for select
  using ((select auth.uid()) = user_id);

drop policy "users insert own item art" on public.item_art;
create policy "users insert own item art for watched items" on public.item_art for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.entries e
      where e.user_id = item_art.user_id and e.item_id = item_art.item_id and e.status = 'watched'
    )
  );

drop policy "users update own item art" on public.item_art;
create policy "users update own item art for watched items" on public.item_art for update
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.entries e
      where e.user_id = item_art.user_id and e.item_id = item_art.item_id and e.status = 'watched'
    )
  );
