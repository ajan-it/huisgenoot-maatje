-- Create household_tasks link table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.household_tasks (
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, task_id)
);

-- Enable RLS
ALTER TABLE public.household_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'household_tasks' AND policyname = 'household_tasks_rw'
  ) THEN
    CREATE POLICY household_tasks_rw
      ON public.household_tasks
      USING (public.is_household_member(household_id))
      WITH CHECK (public.is_household_member(household_id) AND created_by = auth.uid());
  END IF;
END$$;

-- Create RPC function to upsert household tasks
CREATE OR REPLACE FUNCTION public.rpc_upsert_household_tasks(
  p_household_id uuid,
  p_tasks jsonb  -- array of { id?: uuid, slug?: text, active?: boolean }
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count int := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Forbidden: not a household member';
  END IF;

  -- Resolve to UUIDs and upsert
  WITH incoming AS (
    SELECT
      COALESCE( (elem->>'id')::uuid,
                (SELECT id FROM tasks WHERE name = elem->>'slug' AND is_template = true LIMIT 1) ) as task_id,
      COALESCE( (elem->>'active')::boolean, true ) as active
    FROM jsonb_array_elements(p_tasks) elem
  )
  INSERT INTO household_tasks (household_id, task_id, active, created_by)
  SELECT p_household_id, i.task_id, i.active, v_user
  FROM incoming i
  WHERE i.task_id IS NOT NULL
  ON CONFLICT (household_id, task_id)
  DO UPDATE SET active = EXCLUDED.active, updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$$;