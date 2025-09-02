-- Add reminder tracking fields to occurrences table
ALTER TABLE public.occurrences
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reminder_policy TEXT NOT NULL DEFAULT 'gentle',
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reminder_level INT NOT NULL DEFAULT 0;

-- Performance index for reminder queries
CREATE INDEX IF NOT EXISTS occ_due_idx ON public.occurrences (is_critical, due_at);

-- Add reminder settings to households table
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS reminder_settings JSONB 
  DEFAULT jsonb_build_object(
    'email_enabled', true,
    'morning_helper_enabled', true,
    'quiet_hours', jsonb_build_object('start','21:30','end','07:00')
  );