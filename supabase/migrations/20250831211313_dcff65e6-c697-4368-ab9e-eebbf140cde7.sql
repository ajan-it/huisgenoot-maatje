-- Create test occurrences for current and next few weeks
INSERT INTO occurrences (
  id, plan_id, task_id, date, assigned_person, status, start_time, 
  duration_min, difficulty_weight, is_critical, has_backup
)
VALUES 
  -- This week (Aug 31 - Sep 6, 2025)
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-08-31', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4d5c6302-5486-437f-a19f-8922ae497856', '2025-08-31', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'scheduled', '10:00', 45, 1.2, true, true),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '95c2934a-ba7d-4929-bb03-79fe35fbfdef', '2025-08-31', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'completed', '17:30', 30, 1.0, false, false),
  
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-09-01', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '7577bb77-fc3c-4133-8e0c-664abf475aad', '2025-09-01', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '14:00', 60, 1.1, false, false),
  
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-09-02', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4b5845c7-4742-4c4b-b6a3-480c1d93e3f2', '2025-09-02', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'scheduled', '20:00', 15, 1.0, false, false),
  
  -- Next week occurrences
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-09-03', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '95c2934a-ba7d-4929-bb03-79fe35fbfdef', '2025-09-03', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '17:30', 30, 1.2, true, false),
  
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-09-04', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4d5c6302-5486-437f-a19f-8922ae497856', '2025-09-04', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'scheduled', '11:00', 45, 1.2, false, false),
  
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-09-05', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '7577bb77-fc3c-4133-8e0c-664abf475aad', '2025-09-05', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '15:00', 60, 1.1, false, false),
  
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4618a768-6948-445d-a063-300b8daf87aa', '2025-09-06', 'a5326f5b-68da-460c-ac73-bda381c665c1', 'scheduled', '19:00', 30, 1.0, false, false),
  (gen_random_uuid(), 'e8ee79c5-a9e2-4bbe-891d-3a0c2a013598', '4b5845c7-4742-4c4b-b6a3-480c1d93e3f2', '2025-09-06', 'e7b6abb2-dc5f-4c7c-8dab-30febd367755', 'missed', '20:00', 15, 1.0, false, false);