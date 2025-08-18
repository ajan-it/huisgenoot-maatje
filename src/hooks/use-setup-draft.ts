import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { Role } from "@/types/models";
import { POLICY_VERSION } from "@/config";

export type Locale = "nl" | "en";

export interface SetupDraftPerson {
  id: string;
  first_name: string;
  role: Role;
  email?: string;
  phone?: string;
  locale: Locale;
  // Legacy single toggle (kept for backward compat)
  notify_opt_in?: boolean;
  // Channel-specific consent tracking
  notify_email_opt_in?: boolean;
  consent_email_at?: string; // ISO timestamp
  policy_version_email?: string; // default POLICY_VERSION when stamped
  notify_sms_opt_in?: boolean;
  consent_sms_at?: string; // ISO timestamp
  policy_version_sms?: string; // default POLICY_VERSION when stamped
  
  // Time & preferences
  weekly_time_budget?: number; // step 3
  weeknight_cap?: number; // step 3
  disliked_tags?: string[]; // step 3
  no_go_tasks?: string[]; // step 3
  
  // Work context (adults only)
  work_location?: "office" | "hybrid" | "home";
  paid_hours_per_week?: number;        // 0..50
  commute_min_per_day?: number;        // 0..120
  flexibility_score?: number;          // 1..5
  
  // Psychology & fairness
  income_asymmetry_ack?: boolean;      // toggle
  fairness_style_alpha?: number;       // 0.0..0.3 (default 0.15)
  
  // Task preferences
  no_go_tags?: string[];               // hard avoid
  ownership_task_ids?: string[];       // anchor routines (max 3)
  coop_prefs?: { [taskId: string]: "lead" | "assist" | "none" };
}


export interface SetupDraftHousehold {
  name: string;
  postcode?: string;
  house_no?: string;
  settings?: {
    lighten_weekdays?: boolean;
    kids_weekends_only?: boolean;
  };
}

export interface SetupDraftBlackout {
  id: string;
  person_id: string; // local person id
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  start: string; // HH:mm
  end: string; // HH:mm
  note?: string;
  label?: string;
}

export interface SetupDraftTaskSelection {
  id: string; // task id from seeds
  active: boolean;
  frequency?: "daily" | "two_per_week" | "three_per_week" | "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual" | "seasonal" | "custom";
  duration?: number; // minutes
  weekend_only?: boolean;
  avoid_evenings?: boolean;
}

export interface SetupDraftLocalContext {
  waste_days?: Array<{ type: string; day: string }>;
  school_times?: {
    dropoff?: string;
    pickup?: string;
    days?: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[];
  };
}

export interface SetupDraftWeeklyContext {
  week_mode: { [adultId: string]: "normal" | "busy" | "light" };
  night_credit_min: { [adultId: string]: number }; // added ad-hoc
}

export interface SetupDraft {
  household: SetupDraftHousehold;
  people: SetupDraftPerson[];
  blackouts: SetupDraftBlackout[];
  tasks: SetupDraftTaskSelection[];
  local_context?: SetupDraftLocalContext;
  weekly_context?: SetupDraftWeeklyContext;
}

const STORAGE_KEY = "setupDraftV2";

const genId = () => Math.random().toString(36).slice(2, 10);

const defaultDraft = (): SetupDraft => ({
  household: { name: "Ons huishouden", settings: {} },
  people: [
    { id: genId(), first_name: "Ouder 1", role: "adult", locale: "nl", notify_opt_in: false, notify_email_opt_in: false, notify_sms_opt_in: false },
    { id: genId(), first_name: "Ouder 2", role: "adult", locale: "nl", notify_opt_in: false, notify_email_opt_in: false, notify_sms_opt_in: false },
  ],
  blackouts: [],
  tasks: [],
  weekly_context: { week_mode: {}, night_credit_min: {} },
});

export const useSetupDraft = () => {
  const [draft, setDraft] = useState<SetupDraft>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SetupDraft) : defaultDraft();
    } catch {
      return defaultDraft();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Kon setupDraftV2 niet opslaan", e);
    }
  }, [draft]);

  const adultsCount = useMemo(() => draft.people.filter((p) => p.role === "adult").length, [draft.people]);

const addPerson = (role: Role = "child", locale: Locale = "nl") =>
  setDraft((d) => ({
    ...d,
    people: [
      ...d.people,
      {
        id: genId(),
        first_name: role === "adult" ? "Volwassene" : "Kind",
        role,
        locale,
        notify_opt_in: false,
        notify_email_opt_in: false,
        notify_sms_opt_in: false,
      },
    ],
  }));

  const updatePerson = (id: string, patch: Partial<SetupDraftPerson>) =>
    setDraft((d) => ({
      ...d,
      people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const removePerson = (id: string) =>
    setDraft((d) => {
      const next = { ...d, people: d.people.filter((p) => p.id !== id) };
      if (next.people.filter((p) => p.role === "adult").length === 0) {
        toast({ title: "Minimaal 1 volwassene nodig", description: "Voeg een volwassene toe om door te gaan." });
        return d; // keep old if violating rule
      }
      return next;
    });

  const setHousehold = (patch: Partial<SetupDraftHousehold>) =>
    setDraft((d) => ({ ...d, household: { ...d.household, ...patch } }));

  const toggleEmailConsent = (id: string, next: boolean) =>
    setDraft((d) => {
      const people = d.people.map((p) => {
        if (p.id !== id) return p;
        if (next) {
          if (!p.email) {
            toast({ title: "E-mailadres ontbreekt", description: "Vul eerst een e-mailadres in." });
            return p;
          }
          return {
            ...p,
            notify_email_opt_in: true,
            consent_email_at: new Date().toISOString(),
            policy_version_email: POLICY_VERSION,
          } as SetupDraftPerson;
        }
        return { ...p, notify_email_opt_in: false } as SetupDraftPerson; // keep last stamped values
      });
      return { ...d, people };
    });

  const toggleSmsConsent = (id: string, next: boolean) =>
    setDraft((d) => {
      const people = d.people.map((p) => {
        if (p.id !== id) return p;
        if (next) {
          if (!p.phone) {
            toast({ title: "Mobiel nummer ontbreekt", description: "Vul eerst een geldig nummer in." });
            return p;
          }
          return {
            ...p,
            notify_sms_opt_in: true,
            consent_sms_at: new Date().toISOString(),
            policy_version_sms: POLICY_VERSION,
          } as SetupDraftPerson;
        }
        return { ...p, notify_sms_opt_in: false } as SetupDraftPerson; // keep last stamped values
      });
      return { ...d, people };
    });

  return { draft, setDraft, addPerson, updatePerson, removePerson, setHousehold, adultsCount, toggleEmailConsent, toggleSmsConsent };
};
