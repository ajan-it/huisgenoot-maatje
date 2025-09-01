-- Extend frequency enum to support seasonal and yearly tasks
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'seasonal';
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'quarterly'; 
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'semiannual';
ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'annual';