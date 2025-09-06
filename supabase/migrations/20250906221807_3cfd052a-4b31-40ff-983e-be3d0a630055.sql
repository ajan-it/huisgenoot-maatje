-- Replace rpc_create_household with idempotent version
CREATE OR REPLACE FUNCTION public.rpc_create_household(
  p_name     text,
  p_timezone text default 'Europe/Amsterdam',
  p_postcode text default null
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

  -- create household
  INSERT INTO households (name, timezone, postcode, created_by)
  VALUES (COALESCE(p_name, 'Ons gezin'), p_timezone, p_postcode, v_user)
  RETURNING id INTO v_household;

  -- ensure creator is a member (idempotent)
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household, v_user, 'owner')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  RETURN v_household;

EXCEPTION
  WHEN unique_violation THEN
    -- If the insert raced / retried, find the latest owned household
    SELECT id INTO v_household
    FROM households
    WHERE created_by = v_user
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_household IS NULL THEN
      RAISE; -- unrecoverable
    END IF;

    INSERT INTO household_members (household_id, user_id, role)
    VALUES (v_household, v_user, 'owner')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    RETURN v_household;
END;
$$;