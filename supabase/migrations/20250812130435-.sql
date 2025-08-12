-- Set default for created_by to auth.uid() so inserts from clients don't need to pass it explicitly
ALTER TABLE public.households
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Trigger to automatically add owner membership for creator on household insert
DROP TRIGGER IF EXISTS add_owner_membership_after_insert ON public.households;
CREATE TRIGGER add_owner_membership_after_insert
AFTER INSERT ON public.households
FOR EACH ROW
EXECUTE FUNCTION public.add_owner_membership();

-- Keep updated_at fresh on updates
DROP TRIGGER IF EXISTS update_households_updated_at ON public.households;
CREATE TRIGGER update_households_updated_at
BEFORE UPDATE ON public.households
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_people_updated_at ON public.people;
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();