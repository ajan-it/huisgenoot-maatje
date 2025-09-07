-- Fix the RPC function to handle both UUIDs and slugs without unsafe casting
create or replace function public.rpc_upsert_household_tasks(
  p_household_id uuid,
  p_tasks jsonb  -- array of objects: { id?: uuid|string, slug?: text, active?: boolean }
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

  with incoming as (
    select
      (
        select tc.id
        from public.tasks tc
        where tc.is_template = true
          and (
            -- match if client sent a real UUID as text
            tc.id::text = elem->>'id'
            -- match if client sent a slug under "slug"
            or tc.name = elem->>'slug'
            -- backward-compat: client put slug under "id"
            or tc.name = elem->>'id'
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