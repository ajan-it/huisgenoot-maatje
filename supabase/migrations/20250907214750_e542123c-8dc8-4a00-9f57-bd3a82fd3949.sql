-- Create mapping for task slugs to names and fix RPC function
-- First, let me create a proper mapping and update the RPC function

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

  -- Create a mapping from slugs to task names based on the seed data
  with slug_to_name as (
    select * from (values
      ('t1', 'Breakfast preparation'),
      ('t2', 'Cleanup after breakfast'), 
      ('t3', 'Making lunch boxes'),
      ('t4', 'Meal planning'),
      ('t5', 'Dinner preparation'),
      ('t6', 'Family dinner & cleanup'),
      ('t7', 'Start laundry'),
      ('t8', 'Into dryer / hang up'),
      ('t9', 'Fold laundry & put away'),
      ('t10', 'Change bed sheets'),
      ('t11', 'Tidy bedrooms & vacuum'),
      ('t12', 'Weekly cleaning (bathroom, mopping)'),
      ('t13', '15-minute reset (tidying)'),
      ('t14', 'Deep clean fridge/kitchen'),
      ('t15', 'Daycare drop-off (morning)'),
      ('t16', 'Daycare pickup (afternoon)'),
      ('t17', 'Bath time'),
      ('t18', 'Reading / bedtime'),
      ('t19', 'Grocery shopping'),
      ('t20', 'Pharmacy'),
      ('t21', 'Pay bills'),
      ('t22', 'Put out trash & recycling (organic/plastic/general)'),
      ('t23', 'Garden maintenance'),
      ('sea1', 'Pool maintenance'),
      ('sea2', 'BBQ cleaning'),
      ('o1', 'Car wash'),
      ('o2', 'Bike maintenance')
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