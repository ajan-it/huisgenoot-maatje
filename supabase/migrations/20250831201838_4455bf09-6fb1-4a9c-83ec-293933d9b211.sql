-- Create enums for disruption types and boost interactions
CREATE TYPE public.disruption_type AS ENUM (
  'sick_child',
  'childcare_issues', 
  'overtime',
  'late_shifts',
  'commute_delays',
  'travel',
  'guests',
  'events',
  'low_energy',
  'mental_load',
  'appliance_broken',
  'repairs',
  'other'
);

CREATE TYPE public.boost_interaction AS ENUM (
  'acknowledged',
  'rescheduled', 
  'swapped',
  'backup_requested',
  'completed',
  'missed'
);

CREATE TYPE public.boost_channel AS ENUM (
  'push',
  'email',
  'whatsapp',
  'sms'
);

-- Create disruptions table for logging weekly disruptions
CREATE TABLE public.disruptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL,
  week_start DATE NOT NULL,
  type disruption_type NOT NULL,
  affected_person_ids UUID[] NOT NULL DEFAULT '{}',
  nights_impacted INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  consent_a BOOLEAN DEFAULT false,
  consent_b BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boosts_log table for tracking boost interactions
CREATE TABLE public.boosts_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_occurrence_id UUID NOT NULL,
  person_id UUID NOT NULL,
  channel boost_channel NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interaction boost_interaction,
  outcome TEXT,
  escalation_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to occurrences table for boost functionality
ALTER TABLE public.occurrences 
ADD COLUMN is_critical BOOLEAN DEFAULT false,
ADD COLUMN has_backup BOOLEAN DEFAULT false,
ADD COLUMN backup_person_id UUID,
ADD COLUMN boost_enabled BOOLEAN DEFAULT false,
ADD COLUMN fairness_excused BOOLEAN DEFAULT false;

-- Add boost settings to households
ALTER TABLE public.households 
ADD COLUMN boost_settings JSONB DEFAULT '{
  "enabled": false,
  "channels": ["push"],
  "quiet_hours": {"start": "21:30", "end": "07:30"},
  "auto_suggest": {
    "admin": true,
    "childcare": true,
    "errands": true,
    "maintenance": true,
    "safety": true
  }
}'::jsonb;

-- Enable RLS on new tables
ALTER TABLE public.disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for disruptions
CREATE POLICY "Disruptions by household members (select)" 
ON public.disruptions 
FOR SELECT 
USING (is_household_member(household_id));

CREATE POLICY "Disruptions by household members (insert)" 
ON public.disruptions 
FOR INSERT 
WITH CHECK (is_household_member(household_id) AND created_by = auth.uid());

CREATE POLICY "Disruptions by household members (update)" 
ON public.disruptions 
FOR UPDATE 
USING (is_household_member(household_id));

CREATE POLICY "Disruptions by household members (delete)" 
ON public.disruptions 
FOR DELETE 
USING (is_household_member(household_id));

-- Create RLS policies for boosts_log
CREATE POLICY "Boosts by household members (select)" 
ON public.boosts_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM occurrences o 
  JOIN plans p ON p.id = o.plan_id 
  WHERE o.id = boosts_log.task_occurrence_id 
  AND is_household_member(p.household_id)
));

CREATE POLICY "Boosts by household members (insert)" 
ON public.boosts_log 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM occurrences o 
  JOIN plans p ON p.id = o.plan_id 
  WHERE o.id = boosts_log.task_occurrence_id 
  AND is_household_member(p.household_id)
));

CREATE POLICY "Boosts by household members (update)" 
ON public.boosts_log 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM occurrences o 
  JOIN plans p ON p.id = o.plan_id 
  WHERE o.id = boosts_log.task_occurrence_id 
  AND is_household_member(p.household_id)
));

-- Create trigger for updated_at on disruptions
CREATE TRIGGER update_disruptions_updated_at
BEFORE UPDATE ON public.disruptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();