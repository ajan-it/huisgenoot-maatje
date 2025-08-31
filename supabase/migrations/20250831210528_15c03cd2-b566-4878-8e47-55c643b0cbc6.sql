-- Create a test plan for 2025
INSERT INTO plans (id, household_id, week_start, status) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '1b2dc522-7093-4b62-9c40-ce031c527066',
  '2025-08-25',
  'confirmed'
);

-- Create some test tasks
INSERT INTO tasks (id, household_id, name, category, default_duration, difficulty, frequency, active, is_template)
VALUES 
  ('task-001', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Dishwashing', 'cleaning', 30, 2, 'daily', true, false),
  ('task-002', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Vacuum living room', 'cleaning', 45, 3, 'weekly', true, false),
  ('task-003', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Take out trash', 'maintenance', 15, 1, 'weekly', true, false),
  ('task-004', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Grocery shopping', 'errands', 60, 2, 'weekly', true, false),
  ('task-005', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Pick up kids', 'childcare', 30, 2, 'daily', true, false);

-- Create some test people
INSERT INTO people (id, household_id, first_name, role, weekly_time_budget)
VALUES 
  ('person-001', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Alex', 'adult', 300),
  ('person-002', '1b2dc522-7093-4b62-9c40-ce031c527066', 'Jordan', 'adult', 300);

-- Create test occurrences for the current week and next few weeks
INSERT INTO occurrences (
  id, plan_id, task_id, date, assigned_person, status, start_time, 
  duration_min, difficulty_weight, is_critical, has_backup
)
VALUES 
  -- This week (Aug 31 - Sep 6, 2025)
  ('occ-001', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-08-31', 'person-001', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-002', '11111111-1111-1111-1111-111111111111', 'task-002', '2025-08-31', 'person-002', 'scheduled', '10:00', 45, 1.2, true, true),
  ('occ-003', '11111111-1111-1111-1111-111111111111', 'task-005', '2025-08-31', 'person-001', 'completed', '17:30', 30, 1.0, false, false),
  
  ('occ-004', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-09-01', 'person-002', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-005', '11111111-1111-1111-1111-111111111111', 'task-004', '2025-09-01', 'person-001', 'scheduled', '14:00', 60, 1.1, false, false),
  
  ('occ-006', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-09-02', 'person-001', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-007', '11111111-1111-1111-1111-111111111111', 'task-003', '2025-09-02', 'person-002', 'scheduled', '20:00', 15, 1.0, false, false),
  
  -- Next week occurrences
  ('occ-008', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-09-03', 'person-002', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-009', '11111111-1111-1111-1111-111111111111', 'task-005', '2025-09-03', 'person-001', 'scheduled', '17:30', 30, 1.2, true, false),
  
  ('occ-010', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-09-04', 'person-001', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-011', '11111111-1111-1111-1111-111111111111', 'task-002', '2025-09-04', 'person-002', 'scheduled', '11:00', 45, 1.2, false, false),
  
  ('occ-012', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-09-05', 'person-002', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-013', '11111111-1111-1111-1111-111111111111', 'task-004', '2025-09-05', 'person-001', 'scheduled', '15:00', 60, 1.1, false, false),
  
  ('occ-014', '11111111-1111-1111-1111-111111111111', 'task-001', '2025-09-06', 'person-001', 'scheduled', '19:00', 30, 1.0, false, false),
  ('occ-015', '11111111-1111-1111-1111-111111111111', 'task-003', '2025-09-06', 'person-002', 'missed', '20:00', 15, 1.0, false, false);