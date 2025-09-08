-- Create RPC function to remove tasks from plan
create or replace function public.rpc_remove_task_from_plan(
  p_plan_id uuid,
  p_task_id uuid,
  p_mode text default 'week-only'  -- 'week-only' | 'week-and-future'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_household uuid;
  v_occ_deleted int := 0;
  v_ht_updated int := 0;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_household
  from public.plans
  where id = p_plan_id;

  if v_household is null then
    raise exception 'Unknown plan';
  end if;

  if not public.is_household_member(v_household) then
    raise exception 'Forbidden: not a household member';
  end if;

  -- Delete only this week's occurrences for this task
  delete from public.occurrences
   where plan_id = p_plan_id
     and task_id = p_task_id;
  get diagnostics v_occ_deleted = row_count;

  -- Optionally deactivate the household task so it won't be used in future plans
  if p_mode = 'week-and-future' then
    update public.household_tasks
       set active = false, updated_at = now()
     where household_id = v_household
       and task_id = p_task_id;
    get diagnostics v_ht_updated = row_count;
  end if;

  return jsonb_build_object(
    'plan_id', p_plan_id,
    'household_id', v_household,
    'task_id', p_task_id,
    'deleted_occurrences', coalesce(v_occ_deleted, 0),
    'deactivated_household_task', (v_ht_updated > 0),
    'summary', format('Removed %s occurrence(s)%s',
      coalesce(v_occ_deleted,0),
      case when v_ht_updated > 0 then ' and deactivated for future weeks' else '' end)
  );
end;
$$;