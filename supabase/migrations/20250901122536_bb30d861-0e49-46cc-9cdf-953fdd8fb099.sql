-- Extend frequency enum to support seasonal and yearly tasks
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'seasonal';
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'quarterly'; 
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'semiannual';
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'annual';

-- Add frequency_source column to track which frequency generated each occurrence
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS frequency_source frequency_type;

-- Add seasonal placement data for tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS seasonal_months integer[] DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS preferred_month integer DEFAULT NULL;

-- Insert Dutch-specific seasonal task templates
INSERT INTO tasks (name, category, default_duration, difficulty, frequency, is_template, seasonal_months, tags) VALUES
-- Spring tasks (March-May)
('Grote voorjaarsschoonmaak', 'cleaning', 180, 2, 'seasonal', true, ARRAY[3,4,5], ARRAY['seasonal', 'deep-clean']),
('Tuinvoorbereiding', 'garden', 120, 2, 'seasonal', true, ARRAY[3,4], ARRAY['seasonal', 'garden', 'outdoor']),
('Winterkleding opbergen', 'organizing', 90, 1, 'seasonal', true, ARRAY[4,5], ARRAY['seasonal', 'clothes', 'storage']),
('Terras/balkon voorbereiden', 'outdoor', 60, 1, 'seasonal', true, ARRAY[3,4], ARRAY['seasonal', 'outdoor', 'cleaning']),
('Ramen lappen (buiten)', 'cleaning', 45, 1, 'seasonal', true, ARRAY[4,5], ARRAY['seasonal', 'windows', 'outdoor']),

-- Summer tasks (June-August)  
('Tuin onderhoud', 'garden', 90, 2, 'seasonal', true, ARRAY[6,7,8], ARRAY['seasonal', 'garden', 'maintenance']),
('Airco/ventilatie check', 'maintenance', 30, 1, 'seasonal', true, ARRAY[5,6], ARRAY['seasonal', 'hvac', 'summer']),
('Zomerkleding uitzoeken', 'organizing', 60, 1, 'seasonal', true, ARRAY[5,6], ARRAY['seasonal', 'clothes']),
('BBQ schoonmaken', 'cleaning', 45, 1, 'seasonal', true, ARRAY[5,6], ARRAY['seasonal', 'outdoor', 'cleaning']),
('Tuinmeubilair onderhoud', 'maintenance', 75, 1, 'seasonal', true, ARRAY[6,7], ARRAY['seasonal', 'outdoor', 'furniture']),

-- Autumn tasks (September-November)
('Herfstschoonmaak', 'cleaning', 150, 2, 'seasonal', true, ARRAY[9,10], ARRAY['seasonal', 'cleaning']),
('Tuin winterklaar maken', 'garden', 120, 2, 'seasonal', true, ARRAY[10,11], ARRAY['seasonal', 'garden', 'winter-prep']),
('Verwarming controleren', 'maintenance', 45, 1, 'seasonal', true, ARRAY[9,10], ARRAY['seasonal', 'heating', 'maintenance']),
('Winterkleding uitzoeken', 'organizing', 75, 1, 'seasonal', true, ARRAY[9,10], ARRAY['seasonal', 'clothes']),
('Dakgoten schoonmaken', 'maintenance', 90, 2, 'seasonal', true, ARRAY[10,11], ARRAY['seasonal', 'roof', 'maintenance']),

-- Winter tasks (December-February)
('Kerstversiering ophangen', 'organizing', 90, 1, 'seasonal', true, ARRAY[12], ARRAY['seasonal', 'holidays', 'decorating']),
('Kerstversiering opruimen', 'organizing', 60, 1, 'seasonal', true, ARRAY[1], ARRAY['seasonal', 'holidays', 'cleanup']),
('Vorstbeveiliging', 'maintenance', 30, 1, 'seasonal', true, ARRAY[11,12], ARRAY['seasonal', 'winter', 'protection']),
('Sneeuw ruimen voorbereiding', 'maintenance', 45, 1, 'seasonal', true, ARRAY[11,12], ARRAY['seasonal', 'winter', 'snow']),

-- Annual tasks
('Belastingaangifte', 'admin', 180, 3, 'annual', true, NULL, ARRAY['taxes', 'annual', 'admin']),
('Verzekeringen controleren', 'admin', 120, 2, 'annual', true, NULL, ARRAY['insurance', 'annual', 'admin']),
('CV ketel onderhoud', 'maintenance', 60, 1, 'annual', true, NULL, ARRAY['heating', 'annual', 'maintenance']),
('Schoorsteen vegen', 'maintenance', 45, 1, 'annual', true, NULL, ARRAY['chimney', 'annual', 'maintenance']),
('Energieleverancier vergelijken', 'admin', 90, 2, 'annual', true, NULL, ARRAY['energy', 'annual', 'admin']),
('Auto APK', 'admin', 30, 1, 'annual', true, NULL, ARRAY['car', 'annual', 'admin']),
('Hypotheek controleren', 'admin', 60, 2, 'annual', true, NULL, ARRAY['mortgage', 'annual', 'admin']),

-- Quarterly tasks
('Airco filters vervangen', 'maintenance', 15, 1, 'quarterly', true, NULL, ARRAY['hvac', 'quarterly', 'maintenance']),
('Financiële administratie', 'admin', 90, 2, 'quarterly', true, NULL, ARRAY['finance', 'quarterly', 'admin']),
('Medicijnkastje controleren', 'health', 30, 1, 'quarterly', true, NULL, ARRAY['health', 'quarterly', 'safety']),

-- Semi-annual tasks  
('Rookmelders testen', 'safety', 20, 1, 'semiannual', true, NULL, ARRAY['safety', 'semiannual', 'maintenance']),
('Matras omdraaien', 'organizing', 10, 1, 'semiannual', true, NULL, ARRAY['bedroom', 'semiannual', 'maintenance']),
('Waterfilter vervangen', 'maintenance', 15, 1, 'semiannual', true, NULL, ARRAY['water', 'semiannual', 'maintenance'])

ON CONFLICT (name, category, is_template) DO NOTHING;