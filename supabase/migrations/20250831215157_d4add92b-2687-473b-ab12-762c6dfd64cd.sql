-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION check_boost_needed(occurrence_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  occ_record RECORD;
  household_boost_settings JSONB;
  current_time_val TIMESTAMPTZ;
  boost_time TIMESTAMPTZ;
BEGIN
  -- Get occurrence details
  SELECT o.*, p.household_id 
  INTO occ_record
  FROM occurrences o
  JOIN plans p ON p.id = o.plan_id
  WHERE o.id = occurrence_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get household boost settings
  SELECT boost_settings INTO household_boost_settings
  FROM households 
  WHERE id = occ_record.household_id;
  
  -- Check if boosts are enabled
  IF NOT (household_boost_settings->>'enabled')::boolean THEN
    RETURN FALSE;
  END IF;
  
  -- Check if boost is enabled for this occurrence
  IF NOT COALESCE(occ_record.boost_enabled, false) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if task is critical or overdue
  current_time_val := NOW();
  boost_time := (occ_record.date + occ_record.start_time)::timestamptz - INTERVAL '30 minutes';
  
  -- Send boost if it's within 30 minutes of start time and not completed
  RETURN (current_time_val >= boost_time AND occ_record.status != 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION log_boost_interaction(
  occurrence_id uuid,
  person_id uuid,
  channel_used text,
  interaction_type text DEFAULT NULL,
  outcome_text text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO boosts_log (
    task_occurrence_id,
    person_id,
    channel,
    sent_at,
    interaction,
    outcome,
    escalation_used
  ) VALUES (
    occurrence_id,
    person_id,
    channel_used::boost_channel,
    NOW(),
    interaction_type::boost_interaction,
    outcome_text,
    false
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;