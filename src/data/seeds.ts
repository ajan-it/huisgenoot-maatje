import { Task } from "@/types/models";

export interface BlackoutTemplate {
  label: string;
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  start: string; // 24h HH:mm
  end: string;   // 24h HH:mm
  description?: string;
}

export const SEED_BLACKOUTS: BlackoutTemplate[] = [
  { label: "Werkdag (ma–vr 09:00–17:30)", days: ["Mon","Tue","Wed","Thu","Fri"], start: "09:00", end: "17:30" },
  { label: "Ochtendspits (ma–vr 07:30–08:45)", days: ["Mon","Tue","Wed","Thu","Fri"], start: "07:30", end: "08:45" },
  { label: "Avondspits & ophalen (ma–vr 17:00–18:30)", days: ["Mon","Tue","Wed","Thu","Fri"], start: "17:00", end: "18:30" },
  { label: "Bedtijdritueel (dagelijks 19:00–20:00)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "19:00", end: "20:00" },
  { label: "Peuter dutje (13:00–15:00)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "13:00", end: "15:00" },
  { label: "Zelfzorg (sport/meditatie)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "20:00", end: "21:00" },
  { label: "Weekendactiviteiten", days: ["Sat","Sun"], start: "10:00", end: "12:00" },
  { label: "Slaaptijd (21:00–07:00)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "21:00", end: "07:00" },
  { label: "Ziek / reizen", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "00:00", end: "23:59" },
];

export const SEED_TASKS: Task[] = [
  // Keuken & maaltijden
  { id: "t1", name: "Ontbijt voorbereiden", category: "kitchen", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["kitchen","meals"] },
  { id: "t2", name: "Opruimen na ontbijt", category: "kitchen", default_duration: 15, difficulty: 1, frequency: "daily", tags: ["kitchen"] },
  { id: "t3", name: "Broodtrommels klaarmaken", category: "kitchen", default_duration: 10, difficulty: 1, frequency: "daily", tags: ["kitchen","school"] },
  { id: "t4", name: "Maaltijden plannen", category: "admin", default_duration: 25, difficulty: 2, frequency: "weekly", tags: ["planning"] },
  { id: "t5", name: "Diner bereiden", category: "kitchen", default_duration: 45, difficulty: 2, frequency: "daily", tags: ["meals"] },
  { id: "t6", name: "Gezinsdiner & opruimen", category: "kitchen", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["meals"] },
  // Was & kleding
  { id: "t7", name: "Was starten", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["laundry"] },
  { id: "t8", name: "In droger / ophangen", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["laundry"] },
  { id: "t9", name: "Wassen vouwen & opruimen", category: "cleaning", default_duration: 25, difficulty: 2, frequency: "weekly", tags: ["laundry"] },
  { id: "t10", name: "Bedden verschonen", category: "cleaning", default_duration: 30, difficulty: 2, frequency: "weekly", tags: ["bedroom"] },
  // Schoonmaken & huishouden
  { id: "t11", name: "Slaapkamers opruimen & stofzuigen", category: "cleaning", default_duration: 30, difficulty: 2, frequency: "weekly", tags: ["cleaning"] },
  { id: "t12", name: "Wekelijkse schoonmaak (badkamer, dweilen)", category: "cleaning", default_duration: 60, difficulty: 3, frequency: "weekly", tags: ["bathroom","floors"] },
  { id: "t13", name: "15-minuten reset (opruimen)", category: "cleaning", default_duration: 15, difficulty: 1, frequency: "weekly", tags: ["declutter"] },
  { id: "t14", name: "Koelkast/keuken diepteren", category: "kitchen", default_duration: 45, difficulty: 3, frequency: "monthly", tags: ["deepclean"] },
  // Kinderzorg & routine
  { id: "t15", name: "Dagopvang brengen (ochtend)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"] },
  { id: "t16", name: "Dagopvang ophalen (middag)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"] },
  { id: "t17", name: "Baddertijd", category: "childcare", default_duration: 25, difficulty: 1, frequency: "daily", tags: ["routine"] },
  { id: "t18", name: "Voorlezen / bedtijd", category: "childcare", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["routine"] },
  // Boodschappen & klusjes
  { id: "t19", name: "Boodschappen doen", category: "errands", default_duration: 40, difficulty: 2, frequency: "weekly", tags: ["shopping"] },
  { id: "t20", name: "Apotheek", category: "errands", default_duration: 20, difficulty: 1, frequency: "monthly", tags: ["errands"] },
  // Beheer
  { id: "t21", name: "Rekeningen betalen", category: "admin", default_duration: 20, difficulty: 2, frequency: "monthly", tags: ["finance"] },
  { id: "t22", name: "Afval & recycling buiten zetten (GFT/PMD/rest)", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["waste"] },
  { id: "t23", name: "Vaatwasser uitruimen / afdrogen", category: "kitchen", default_duration: 10, difficulty: 1, frequency: "daily", tags: ["dishes"] },
  // Sociaal & zelfzorg
  { id: "t24", name: "Koppeltijd / self-care", category: "selfcare", default_duration: 60, difficulty: 1, frequency: "weekly", tags: ["selfcare"] },
];
