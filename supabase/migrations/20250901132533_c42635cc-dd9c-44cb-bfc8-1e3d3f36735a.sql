-- Create task overrides table for Quick Include/Exclude functionality
CREATE TABLE public.task_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('once', 'week', 'month', 'always', 'snooze')),
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  action TEXT NOT NULL CHECK (action IN ('include', 'exclude', 'frequency_change')),
  frequency TEXT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_task_overrides_household_task_date 
ON public.task_overrides (household_id, task_id, effective_from);

-- Create index for time-based queries
CREATE INDEX idx_task_overrides_dates 
ON public.task_overrides (effective_from, effective_to);

-- Enable RLS
ALTER TABLE public.task_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Task overrides by household members (select)" 
ON public.task_overrides 
FOR SELECT 
USING (is_household_member(household_id));

CREATE POLICY "Task overrides by household members (insert)" 
ON public.task_overrides 
FOR INSERT 
WITH CHECK (is_household_member(household_id) AND created_by = auth.uid());

CREATE POLICY "Task overrides by household members (update)" 
ON public.task_overrides 
FOR UPDATE 
USING (is_household_member(household_id));

CREATE POLICY "Task overrides by household members (delete)" 
ON public.task_overrides 
FOR DELETE 
USING (is_household_member(household_id));

-- Create trigger for updated_at
CREATE TRIGGER update_task_overrides_updated_at
BEFORE UPDATE ON public.task_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();