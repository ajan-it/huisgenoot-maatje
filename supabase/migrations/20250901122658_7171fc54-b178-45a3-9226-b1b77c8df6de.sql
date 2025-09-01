-- Add missing category types for seasonal tasks
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'outdoor';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'organizing';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'health';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'safety';