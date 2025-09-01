export interface TaskOverride {
  id: string;
  household_id: string;
  task_id: string;
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  effective_from: string;
  effective_to?: string;
  action: 'include' | 'exclude' | 'frequency_change';
  frequency?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScopeOptions {
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  snoozeUntil?: Date;
  frequency?: string;
}

export interface TaskAction {
  taskId: string;
  action: 'include' | 'exclude' | 'frequency_change';
  scope: ScopeOptions;
}