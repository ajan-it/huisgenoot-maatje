-- Fix security definer view issue by removing SECURITY DEFINER from plan_integrity view
DROP VIEW IF EXISTS public.plan_integrity;

CREATE VIEW public.plan_integrity AS
SELECT 
  p.id as plan_id,
  p.household_id,
  p.week_start,
  count(o.id) as occurrences,
  count(DISTINCT o.task_id) as unique_tasks,
  ht_counts.selected_active,
  dup_counts.duplicate_occ_span,
  missing_counts.missing_from_selection,
  unscheduled_counts.not_scheduled
FROM plans p
LEFT JOIN occurrences o ON o.plan_id = p.id
LEFT JOIN (
  SELECT ht.household_id, count(*) as selected_active
  FROM household_tasks ht
  WHERE ht.active = true
  GROUP BY ht.household_id
) ht_counts ON ht_counts.household_id = p.household_id
LEFT JOIN (
  SELECT 
    plan_id,
    count(*) as duplicate_occ_span
  FROM occurrences
  GROUP BY plan_id, task_id, date
  HAVING count(*) > 1
) dup_counts ON dup_counts.plan_id = p.id
LEFT JOIN (
  SELECT 
    p2.id as plan_id,
    count(*) as missing_from_selection
  FROM plans p2
  JOIN household_tasks ht2 ON ht2.household_id = p2.household_id AND ht2.active = true
  LEFT JOIN occurrences o2 ON o2.plan_id = p2.id AND o2.task_id = ht2.task_id
  WHERE o2.id IS NULL
  GROUP BY p2.id
) missing_counts ON missing_counts.plan_id = p.id
LEFT JOIN (
  SELECT plan_id, count(*) as not_scheduled
  FROM occurrences
  WHERE assigned_person IS NULL
  GROUP BY plan_id
) unscheduled_counts ON unscheduled_counts.plan_id = p.id
GROUP BY p.id, p.household_id, p.week_start, ht_counts.selected_active, dup_counts.duplicate_occ_span, missing_counts.missing_from_selection, unscheduled_counts.not_scheduled;