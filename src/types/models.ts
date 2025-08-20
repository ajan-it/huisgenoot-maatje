import type { ReactNode } from "react";

export type Role = "adult" | "child";
export type Frequency = "daily" | "two_per_week" | "three_per_week" | "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual" | "seasonal" | "custom";
export type Difficulty = 1 | 2 | 3;

export interface HouseholdSettings {
  lighten_weekdays?: boolean;
  kids_weekend_only?: boolean;
  fairness_toggles?: string[];
  timezone?: string; // e.g., Europe/Amsterdam
}

export interface Household {
  id: string;
  postcode?: string;
  settings: HouseholdSettings;
}

export interface BlackoutSlot {
  id: string;
  label: string;
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  start: string; // 24h HH:mm
  end: string;   // 24h HH:mm
  description?: string;
}

export interface PersonContact {
  email?: string;
  phone?: string;
  prefers?: "email" | "whatsapp" | "sms";
  consent?: boolean; // GDPR consent for notifications
}

export interface Person {
  id: string;
  household_id?: string;
  first_name: string;
  role: Role;
  weekly_time_budget: number; // minutes per week
  disliked_tasks?: string[]; // task name tags
  no_go_tasks?: string[];
  blackout_slots?: BlackoutSlot[];
  contact?: PersonContact;
  locale?: "nl" | "en";
}

export interface Task {
  id: string;
  name: string;
  category:
    | "kitchen"
    | "bathroom"
    | "cleaning"
    | "admin"
    | "childcare"
    | "errands"
    | "maintenance"
    | "selfcare"
    | "social"
    | "garden"
    | "appliance"
    | "safety"
    | "outdoor"
    | "seasonal";
  default_duration: number; // minutes
  difficulty: Difficulty;
  frequency: Frequency;
  location?: "indoor" | "outdoor";
  tags?: string[];
  packs?: string[];
  helper_text?: string;
  active?: boolean;
  pair_group?: string; // For paired tasks that should alternate
}

export interface Plan {
  id: string;
  household_id?: string;
  week_start: string; // ISO date string (Monday)
  fairness_score?: number; // 0–100
  status: "draft" | "confirmed" | "sent";
}

export type OccurrenceStatus = "scheduled" | "done" | "moved" | "backlog";

export interface Occurrence {
  id: string;
  plan_id: string;
  task_id: string;
  date: string; // ISO date string
  assigned_person?: string; // person id
  status: OccurrenceStatus;
  rationale?: {
    available?: boolean;
    preferred?: boolean;
    balanced?: boolean;
  };
}

export type Children = ReactNode | ReactNode[];
