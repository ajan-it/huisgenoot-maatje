-- Create transactional RPC for task removal with proper metrics and authentication
CREATE OR REPLACE FUNCTION public.rpc_remove_task_transactional(
  p_plan_id uuid, 
  p_task_id uuid, 
  p_mode text DEFAULT 'week'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_household uuid;
  v_occ_deleted int := 0;
  v_ht_updated int := 0;
  v_task_name text;
  v_result jsonb;
BEGIN
  -- Authentication check
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get household and task info
  SELECT p.household_id, t.name 
  INTO v_household, v_task_name
  FROM public.plans p
  LEFT JOIN public.occurrences o ON o.plan_id = p.id AND o.task_id = p_task_id
  LEFT JOIN public.tasks t ON t.id = p_task_id
  WHERE p.id = p_plan_id
  LIMIT 1;

  IF v_household IS NULL THEN
    RAISE EXCEPTION 'Unknown plan: %', p_plan_id;
  END IF;

  -- Authorization check
  IF NOT public.is_household_member(v_household) THEN
    RAISE EXCEPTION 'Forbidden: not a household member';
  END IF;

  -- Transaction: Delete occurrences for this week
  DELETE FROM public.occurrences
  WHERE plan_id = p_plan_id
    AND task_id = p_task_id;
  GET DIAGNOSTICS v_occ_deleted = ROW_COUNT;

  -- Optionally deactivate for future (if mode = 'future')
  IF p_mode = 'future' THEN
    UPDATE public.household_tasks
    SET active = false, updated_at = now()
    WHERE household_id = v_household
      AND task_id = p_task_id;
    GET DIAGNOSTICS v_ht_updated = ROW_COUNT;
  END IF;

  -- Build response with metrics
  v_result := jsonb_build_object(
    'success', true,
    'plan_id', p_plan_id,
    'household_id', v_household,
    'task_id', p_task_id,
    'task_name', COALESCE(v_task_name, 'Unknown Task'),
    'deleted_occurrences', v_occ_deleted,
    'deactivated_household_task', (v_ht_updated > 0),
    'mode', p_mode,
    'summary', format('Removed %s occurrence(s) of "%s"%s',
      v_occ_deleted,
      COALESCE(v_task_name, 'Unknown Task'),
      CASE WHEN v_ht_updated > 0 THEN ' and deactivated for future weeks' ELSE '' END
    )
  );

  RETURN v_result;
END;
$$;

-- Add comment for security documentation
COMMENT ON FUNCTION public.rpc_remove_task_transactional(uuid, uuid, text) IS 
'SECURITY DEFINER required: Transactional task removal with authentication and RLS validation';