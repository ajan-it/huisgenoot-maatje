-- Replace rpc_create_household to fix "name column does not exist" error
-- Store household name in settings->>'name' instead of non-existent name column

CREATE OR REPLACE FUNCTION public.rpc_create_household(
  p_name text DEFAULT NULL,
  p_timezone text DEFAULT 'Europe/Amsterdam',
  p_postcode text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_household uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create household (store display name inside settings JSON)
  INSERT INTO households (timezone, postcode, created_by, settings)
  VALUES (
    p_timezone,
    p_postcode,
    v_user,
    COALESCE(jsonb_build_object('name', COALESCE(p_name, 'Ons gezin')), '{}'::jsonb)
  )
  RETURNING id INTO v_household;

  -- Ensure creator is a member (idempotent)
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household, v_user, 'owner')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  RETURN v_household;

EXCEPTION
  WHEN unique_violation THEN
    -- If we raced or retried, reuse the latest owned household
    SELECT id INTO v_household
    FROM households
    WHERE created_by = v_user
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_household IS NULL THEN
      RAISE;
    END IF;

    INSERT INTO household_members (household_id, user_id, role)
    VALUES (v_household, v_user, 'owner')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    RETURN v_household;
END;
$$;