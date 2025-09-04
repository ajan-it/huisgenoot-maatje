-- Create function to get occurrence status labels dynamically
CREATE OR REPLACE FUNCTION public.get_occurrence_status_labels()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder)
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'occurrence_status'
    AND n.nspname = 'public';
$$;