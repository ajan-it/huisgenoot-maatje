-- Add frequency_source column and seasonal placement data
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS frequency_source frequency_type;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS seasonal_months integer[] DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS preferred_month integer DEFAULT NULL;

-- Insert Dutch-specific seasonal task templates (only if they don't exist)
DO $$
BEGIN
  -- Spring tasks (March-May)
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Grote voorjaarsschoonmaak' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Grote voorjaarsschoonmaak', 'cleaning', 180, 2, 'seasonal', true, ARRAY[3,4,5], ARRAY['seasonal', 'deep-clean']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Tuinvoorbereiding' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Tuinvoorbereiding', 'garden', 120, 2, 'seasonal', true, ARRAY[3,4], ARRAY['seasonal', 'garden', 'outdoor']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Winterkleding opbergen' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Winterkleding opbergen', 'organizing', 90, 1, 'seasonal', true, ARRAY[4,5], ARRAY['seasonal', 'clothes', 'storage']);
  END IF;

  -- Summer tasks (June-August)  
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Tuin onderhoud' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Tuin onderhoud', 'garden', 90, 2, 'seasonal', true, ARRAY[6,7,8], ARRAY['seasonal', 'garden', 'maintenance']);
  END IF;

  -- Autumn tasks (September-November)
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Herfstschoonmaak' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Herfstschoonmaak', 'cleaning', 150, 2, 'seasonal', true, ARRAY[9,10], ARRAY['seasonal', 'cleaning']);
  END IF;

  -- Winter tasks (December-February)
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Kerstversiering ophangen' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Kerstversiering ophangen', 'organizing', 90, 1, 'seasonal', true, ARRAY[12], ARRAY['seasonal', 'holidays', 'decorating']);
  END IF;

  -- Annual tasks
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Belastingaangifte' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Belastingaangifte', 'admin', 180, 3, 'annual', true, NULL, ARRAY['taxes', 'annual', 'admin']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'CV ketel onderhoud' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('CV ketel onderhoud', 'maintenance', 60, 1, 'annual', true, NULL, ARRAY['heating', 'annual', 'maintenance']);
  END IF;

  -- Quarterly tasks
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Financiële administratie' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Financiële administratie', 'admin', 90, 2, 'quarterly', true, NULL, ARRAY['finance', 'quarterly', 'admin']);
  END IF;

  -- Semi-annual tasks  
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE name = 'Rookmelders testen' AND is_template = true) THEN
    INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
    ('Rookmelders testen', 'safety', 20, 1, 'semiannual', true, NULL, ARRAY['safety', 'semiannual', 'maintenance']);
  END IF;
END $$;