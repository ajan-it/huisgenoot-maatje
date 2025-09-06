-- Create secure RPC function for household creation
-- This eliminates client-side auth context issues by using auth.uid() server-side

CREATE OR REPLACE FUNCTION public.rpc_create_household(
  household_name text,
  household_timezone text DEFAULT 'Europe/Amsterdam',
  household_settings jsonb DEFAULT '{}'::jsonb,
  household_postcode text DEFAULT NULL
)
RETURNS TABLE(household_id uuid, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_id uuid;
  new_household_id uuid;
BEGIN
  -- Get the authenticated user ID
  auth_user_id := auth.uid();
  
  -- Guard: Raise exception if no authenticated user
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: auth.uid() is null. Please ensure you are logged in.';
  END IF;
  
  -- Insert household in a single transaction
  INSERT INTO public.households (
    id,
    settings,
    created_by,
    timezone,
    postcode,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    household_settings,
    auth_user_id,
    household_timezone,
    household_postcode,
    now(),
    now()
  ) RETURNING id INTO new_household_id;
  
  -- Add the creator as household owner
  INSERT INTO public.household_members (
    household_id,
    user_id,
    role,
    created_at
  ) VALUES (
    new_household_id,
    auth_user_id,
    'owner',
    now()
  );
  
  -- Return the result
  RETURN QUERY SELECT new_household_id, auth_user_id;
END;
$$;