import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { Role } from "@/types/models";

export type Locale = "nl" | "en";

export interface SetupDraftPerson {
  id: string;
  first_name: string;
  role: Role;
  email?: string;
  phone?: string;
  locale: Locale;
  notify_opt_in?: boolean;
  weekly_time_budget?: number; // step 3
  weeknight_cap?: number; // step 3
  disliked_tags?: string[]; // step 3
  no_go_tasks?: string[]; // step 3
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
  frequency?: "daily" | "weekly" | "monthly"; // step 6
  default_duration?: number; // minutes
  difficulty?: 1 | 2 | 3;
  tags?: string[];
}

export interface SetupDraftLocalContext {
  waste_days?: Array<{ type: string; day: string }>;
  school_times?: {
    dropoff?: string;
    pickup?: string;
    days?: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[];
  };
}

export interface SetupDraft {
  household: SetupDraftHousehold;
  people: SetupDraftPerson[];
  blackouts: SetupDraftBlackout[];
  tasks: SetupDraftTaskSelection[];
  local_context?: SetupDraftLocalContext;
}

const STORAGE_KEY = "setupDraftV2";

const genId = () => Math.random().toString(36).slice(2, 10);

const defaultDraft = (): SetupDraft => ({
  household: { name: "Ons huishouden", settings: {} },
  people: [
    { id: genId(), first_name: "Ouder 1", role: "adult", locale: "nl", notify_opt_in: false },
    { id: genId(), first_name: "Ouder 2", role: "adult", locale: "nl", notify_opt_in: false },
  ],
  blackouts: [],
  tasks: [],
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

  const addPerson = (role: Role = "child") =>
    setDraft((d) => ({
      ...d,
      people: [
        ...d.people,
        { id: genId(), first_name: role === "adult" ? "Volwassene" : "Kind", role, locale: "nl", notify_opt_in: false },
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

  return { draft, setDraft, addPerson, updatePerson, removePerson, setHousehold, adultsCount };
};
