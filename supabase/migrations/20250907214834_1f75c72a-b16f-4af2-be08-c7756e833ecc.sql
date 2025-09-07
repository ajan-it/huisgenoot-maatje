-- Update RPC function with correct Dutch task names
create or replace function public.rpc_upsert_household_tasks(
  p_household_id uuid,
  p_tasks jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count int := 0;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden: not a household member';
  end if;

  -- Create a mapping from slugs to actual Dutch task names in database
  with slug_to_name as (
    select * from (values
      ('t1', 'Ontbijt voorbereiden'),
      ('t2', 'Opruimen na ontbijt'), 
      ('t3', 'Broodtrommels klaarmaken'),
      ('t4', 'Maaltijden plannen'),
      ('t5', 'Diner bereiden'),
      ('t6', 'Gezinsdiner & opruimen'),
      ('t7', 'Was starten'),
      ('t8', 'In droger / ophangen'),
      ('t9', 'Wassen vouwen & opruimen'),
      ('t10', 'Bedden verschonen'),
      ('t11', 'Slaapkamers opruimen & stofzuigen'),
      ('t12', 'Wekelijkse schoonmaak (badkamer, dweilen)'),
      ('t13', '15-minuten reset (opruimen)'),
      ('t14', 'Koelkast/keuken diepteren'),
      ('t15', 'Dagopvang brengen (ochtend)'),
      ('t16', 'Dagopvang ophalen (middag)'),
      ('t17', 'Baddertijd'),
      ('t18', 'Voorlezen / bedtijd'),
      ('t19', 'Boodschappen doen'),
      ('t20', 'Apotheek'),
      ('t21', 'Rekeningen betalen'),
      ('t22', 'Afval & recycling buiten zetten (GFT/PMD/rest)'),
      ('t23', 'Tuin onderhoud'),
      ('sea1', 'Tuinvoorbereiding'),
      ('sea2', 'Herfstschoonmaak'),
      ('o1', 'Grote voorjaarsschoonmaak'),
      ('o2', 'CV ketel onderhoud')
    ) as mapping(slug, task_name)
  ),
  incoming as (
    select
      (
        select tc.id
        from public.tasks tc
        where tc.is_template = true
          and (
            -- match if client sent a real UUID as text
            tc.id::text = elem->>'id'
            -- match if client sent a slug under "slug"
            or tc.name = (select task_name from slug_to_name where slug = elem->>'slug')
            -- backward-compat: client put slug under "id"
            or tc.name = (select task_name from slug_to_name where slug = elem->>'id')
          )
        limit 1
      ) as task_id,
      coalesce((elem->>'active')::boolean, true) as active
    from jsonb_array_elements(p_tasks) elem
  )
  insert into public.household_tasks (household_id, task_id, active, created_by)
  select p_household_id, i.task_id, i.active, v_user
  from incoming i
  where i.task_id is not null
  on conflict (household_id, task_id)
  do update set active = excluded.active, updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;