-- Relax and harden INSERT policy for households and ensure created_by set before RLS check
DROP POLICY IF EXISTS "Insert own households" ON public.households;

CREATE POLICY "Insert own households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = COALESCE(created_by, auth.uid()));

-- Ensure created_by is set to auth.uid() before RLS check
CREATE OR REPLACE FUNCTION public.set_household_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_household_created_by_before_insert ON public.households;
CREATE TRIGGER set_household_created_by_before_insert
BEFORE INSERT ON public.households
FOR EACH ROW
EXECUTE FUNCTION public.set_household_created_by();