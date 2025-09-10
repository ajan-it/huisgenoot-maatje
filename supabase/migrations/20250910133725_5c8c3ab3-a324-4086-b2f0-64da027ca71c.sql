-- Clean up duplicate functions and minimize SECURITY DEFINER usage
-- Remove the old rpc_create_household function with the complex signature

DROP FUNCTION IF EXISTS public.rpc_create_household(
  household_name text, 
  household_timezone text, 
  household_settings jsonb, 
  household_postcode text
);

-- Ensure we only have the cleaner version
-- The other rpc_create_household(p_name, p_timezone, p_postcode) should remain

-- Document that remaining SECURITY DEFINER functions are necessary:
-- 1. is_household_member - Required for RLS policies to work
-- 2. Trigger functions - Required for trigger execution context
-- 3. RPC functions - Required for complex multi-table operations with proper auth checks

COMMENT ON FUNCTION public.is_household_member(uuid) IS 
'SECURITY DEFINER required: Used in RLS policies to check household membership';

COMMENT ON FUNCTION public.add_owner_membership() IS 
'SECURITY DEFINER required: Trigger function needs elevated privileges';

COMMENT ON FUNCTION public.set_household_created_by() IS 
'SECURITY DEFINER required: Trigger function needs elevated privileges';

COMMENT ON FUNCTION public.update_updated_at_column() IS 
'SECURITY DEFINER required: Trigger function needs elevated privileges';

COMMENT ON FUNCTION public.rpc_create_household(text, text, text) IS 
'SECURITY DEFINER required: Multi-table operation with auth validation';

COMMENT ON FUNCTION public.rpc_upsert_household_tasks(uuid, jsonb) IS 
'SECURITY DEFINER required: Complex operation with membership validation';

COMMENT ON FUNCTION public.rpc_remove_task_from_plan(uuid, uuid, text) IS 
'SECURITY DEFINER required: Multi-table operation with auth validation';