export type DisruptionType = 
  | 'sick_child'
  | 'childcare_issues' 
  | 'overtime'
  | 'late_shifts'
  | 'commute_delays'
  | 'travel'
  | 'guests'
  | 'events'
  | 'low_energy'
  | 'mental_load'
  | 'appliance_broken'
  | 'repairs'
  | 'other';

export type BoostInteraction = 
  | 'acknowledged'
  | 'rescheduled' 
  | 'swapped'
  | 'backup_requested'
  | 'completed'
  | 'missed';

export type BoostChannel = 'push' | 'email' | 'whatsapp' | 'sms';

export interface Disruption {
  id: string;
  household_id: string;
  week_start: string;
  type: DisruptionType;
  affected_person_ids: string[];
  nights_impacted: number;
  notes?: string;
  consent_a: boolean;
  consent_b: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BoostLog {
  id: string;
  task_occurrence_id: string;
  person_id: string;
  channel: BoostChannel;
  sent_at: string;
  interaction?: BoostInteraction;
  outcome?: string;
  escalation_used: boolean;
  created_at: string;
}

export interface BoostSettings {
  enabled: boolean;
  channels: BoostChannel[];
  quiet_hours: {
    start: string;
    end: string;
  };
  auto_suggest: {
    admin: boolean;
    childcare: boolean;
    errands: boolean;
    maintenance: boolean;
    safety: boolean;
  };
}

export const DISRUPTION_LABELS: Record<DisruptionType, string> = {
  sick_child: 'Sick child / childcare issues',
  childcare_issues: 'Childcare issues',
  overtime: 'Overtime / late shifts',
  late_shifts: 'Late shifts',
  commute_delays: 'Commute delays',
  travel: 'Travel / guests / events',
  guests: 'Guests',
  events: 'Events',
  low_energy: 'Low energy / mental load',
  mental_load: 'Mental load',
  appliance_broken: 'Appliance broken / repairs',
  repairs: 'Repairs',
  other: 'Other'
};