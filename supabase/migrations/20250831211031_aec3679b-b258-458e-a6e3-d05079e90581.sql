-- Create a test plan for 2025
INSERT INTO plans (id, household_id, week_start, status) 
VALUES (
  gen_random_uuid(),
  '1b2dc522-7093-4b62-9c40-ce031c527066',
  '2025-08-25',
  'confirmed'
);

-- Create some test tasks with proper UUIDs
INSERT INTO tasks (id, household_id, name, category, default_duration, difficulty, frequency, active, is_template)
VALUES 
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Dishwashing', 'cleaning', 30, 2, 'daily', true, false),
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Vacuum living room', 'cleaning', 45, 3, 'weekly', true, false),
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Take out trash', 'maintenance', 15, 1, 'weekly', true, false),
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Grocery shopping', 'errands', 60, 2, 'weekly', true, false),
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Pick up kids', 'childcare', 30, 2, 'daily', true, false);

-- Create some test people with proper UUIDs
INSERT INTO people (id, household_id, first_name, role, weekly_time_budget)
VALUES 
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Alex', 'adult', 300),
  (gen_random_uuid(), '1b2dc522-7093-4b62-9c40-ce031c527066', 'Jordan', 'adult', 300);