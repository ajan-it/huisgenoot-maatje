-- Fix security issue by recreating view without SECURITY DEFINER
DROP VIEW IF EXISTS public.plan_integrity;

CREATE VIEW public.plan_integrity AS
WITH per_plan AS (
  SELECT
    p.id as plan_id,
    p.household_id,
    p.week_start,
    (SELECT COUNT(*) FROM public.occurrences o WHERE o.plan_id = p.id) as occurrences,
    (SELECT COUNT(DISTINCT o.task_id) FROM public.occurrences o WHERE o.plan_id = p.id) as unique_tasks,
    (SELECT COUNT(DISTINCT ht.task_id)
       FROM public.household_tasks ht
      WHERE ht.household_id = p.household_id AND ht.active = true) as selected_active
  FROM public.plans p
)
SELECT *,
       (occurrences - unique_tasks) as duplicate_occ_span,
       (unique_tasks - selected_active) as missing_from_selection,
       (selected_active - unique_tasks) as not_scheduled
FROM per_plan;