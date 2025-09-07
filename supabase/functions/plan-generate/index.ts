import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Full task definitions with all required properties
const SEED_TASKS = [
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
  { id: "t15", name: "Dagopvang brengen (ochtend)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"], pair_group: "daycare_dropoff" },
  { id: "t16", name: "Dagopvang ophalen (middag)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"], pair_group: "daycare_pickup" },
  { id: "t17", name: "Baddertijd", category: "childcare", default_duration: 25, difficulty: 1, frequency: "daily", tags: ["routine"], pair_group: "bath_bedtime" },
  { id: "t18", name: "Voorlezen / bedtijd", category: "childcare", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["routine"], pair_group: "bath_bedtime" },
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

// Fairness allocation engine constants
const LAMBDA = 14; // Proportional fairness weight (increased for stronger balance)
const DIFFICULTY_WEIGHTS = { 1: 1.0, 2: 1.2, 3: 1.5 };
const WEEKNIGHT_CAP_DEFAULT = 30; // minutes
const MAX_EVENING_MIN = 40; // hard cap per person per evening
const MAX_EVENING_TASKS = 2; // hard cap per person per evening
const SAME_EVENING_THRESHOLD = 40; // minutes
const SAME_DAY_TASK_LIMIT = 3;
const MAX_OCCURRENCES = 500;
const MAX_SWAP_ITERATIONS = 200; // increased for better rebalancing
const MAX_DURATION_MS = 300; // reduced to 300ms max
const EARLY_STOP_THRESHOLD = 10;

// Time slot definitions
const WEEKNIGHT_START = "18:00";
const WEEKNIGHT_END = "21:30";
const WEEKNIGHTS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Helper functions for local date handling
function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m - 1), d); // local time
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Day matching for blackouts
const DOW_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DOW_NL = ["zo","ma","di","wo","do","vr","za"];
function dayMatches(days: string[], jsDay: number) {
  const en = DOW_EN[jsDay];
  const nl = DOW_NL[jsDay];
  return days.includes(en) || days.includes(en.toLowerCase()) || days.includes(nl);
}

interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

interface Occurrence {
  id: string;
  task_id: string;
  task_name: string;
  task_duration: number;
  task_difficulty: number;
  task_category: string;
  task_tags: string[];
  pair_group?: string;
  date: string; // YYYY-MM-DD
  time_slot: TimeSlot;
  assigned_person_id?: string;
  assigned_person_name?: string;
  status: 'scheduled' | 'backlog';
  rationale?: {
    reasons: string[];
  };
}

interface Adult {
  id: string;
  first_name: string;
  weekly_time_budget: number;
  disliked_tags?: string[];
  no_go_tasks?: string[];
  blackout_slots?: any[];
  weeknight_cap?: number;
}

interface Context {
  adults: Adult[];
  totalLoad: number;
  load: { [adultId: string]: number };
  targetShare: { [adultId: string]: number };
  weeknightLoad: { [adultId: string]: number };
  dailyTaskCount: { [adultId: string]: { [date: string]: number } };
  eveningLoad: { [adultId: string]: { [date: string]: number } };
  eveningTaskCount: { [adultId: string]: { [date: string]: number } };
  pairAssignments: { [pairGroup: string]: { [date: string]: string } }; // track who gets paired tasks
  weekPatterns: { [pairGroup: string]: { [personId: string]: string[] } }; // alternating patterns
}

// Deterministic input stabilization
function stabilizeInputs(tasks: any[], adults: Adult[], idempotencyKey: string) {
  // Seed for any randomness
  const seed = hashString(idempotencyKey);
  
  // Sort tasks deterministically
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.id !== b.id) return a.id.localeCompare(b.id);
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
  
  // Sort adults deterministically
  const sortedAdults = [...adults].sort((a, b) => a.id.localeCompare(b.id));
  
  return { sortedTasks, sortedAdults, seed };
}

// Simple hash function for seeding
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate time slots for tasks
function generateTimeSlots(frequency: string): TimeSlot[] {
  const morningSlots: TimeSlot[] = [
    { start: "07:00", end: "07:30" },
    { start: "07:30", end: "08:00" },
    { start: "08:00", end: "08:30" }
  ];
  
  const eveningSlots: TimeSlot[] = [
    { start: "18:00", end: "18:30" },
    { start: "18:30", end: "19:00" },
    { start: "19:30", end: "20:00" },
    { start: "20:00", end: "20:30" }
  ];
  
  const weekendSlots: TimeSlot[] = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" }
  ];
  
  // Mix slots based on frequency
  if (frequency === "daily") {
    return [...morningSlots, ...eveningSlots];
  } else {
    return [...morningSlots, ...eveningSlots, ...weekendSlots];
  }
}

// Expand tasks to concrete occurrences (one per frequency period)
function expandTaskOccurrences(tasks: any[], weekStart: string): Occurrence[] {
  const startDate = parseYmdLocal(weekStart);
  const occurrences: Occurrence[] = [];
  let occurrenceCount = 0;
  
  for (const task of tasks) {
    if (occurrenceCount >= MAX_OCCURRENCES) break;
    
    const taskNameLc = (task.name || "").toLowerCase();
    
    if (task.frequency === "daily") {
      // Create one occurrence per day (7 total)
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        if (occurrenceCount >= MAX_OCCURRENCES) break;
        
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = ymdLocal(date);
        
        // Choose appropriate time slot based on task category
        let timeSlot: TimeSlot;
        if (task.category === "kitchen" && taskNameLc.includes("ontbijt")) {
          timeSlot = { start: "07:00", end: "07:30" };
        } else if (task.category === "childcare" && taskNameLc.includes("brengen")) {
          timeSlot = { start: "08:00", end: "08:30" };
        } else if (task.category === "childcare" && taskNameLc.includes("ophalen")) {
          timeSlot = { start: "17:00", end: "17:30" };
        } else if (task.category === "childcare" && (taskNameLc.includes("bad") || taskNameLc.includes("bed"))) {
          timeSlot = { start: "19:00", end: "19:30" };
        } else if (task.category === "kitchen" && taskNameLc.includes("diner")) {
          timeSlot = { start: "18:00", end: "19:00" };
        } else {
          // Default evening slot for other tasks
          timeSlot = { start: "20:00", end: "20:30" };
        }
        
        occurrences.push({
          id: `${task.id}-${dateStr}`,
          task_id: task.id,
          task_name: task.name,
          task_duration: task.default_duration,
          task_difficulty: task.difficulty,
          task_category: task.category,
          task_tags: task.tags || [],
          pair_group: task.pair_group,
          date: dateStr,
          time_slot: timeSlot,
          status: 'scheduled'
        });
        occurrenceCount++;
      }
    } else if (task.frequency === "weekly") {
      // Create one occurrence per week
      let dayOffset: number;
      let timeSlot: TimeSlot;
      
      // Choose day and time based on task category
      if (task.category === "cleaning" && (task.name.includes("was") || task.name.includes("bed"))) {
        dayOffset = 6; // Sunday for laundry/bed changing
        timeSlot = { start: "10:00", end: "11:00" };
      } else if (task.category === "errands" || task.name.includes("boodschappen")) {
        dayOffset = 5; // Saturday for errands
        timeSlot = { start: "10:00", end: "11:00" };
      } else if (task.category === "cleaning" && task.name.includes("schoonmaak")) {
        dayOffset = 5; // Saturday for deep cleaning
        timeSlot = { start: "14:00", end: "15:00" };
      } else if (task.category === "admin") {
        dayOffset = 6; // Sunday for admin tasks
        timeSlot = { start: "20:00", end: "20:30" };
      } else {
        // Default to Wednesday evening
        dayOffset = 2;
        timeSlot = { start: "20:00", end: "20:30" };
      }
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = ymdLocal(date);
      
      occurrences.push({
        id: `${task.id}-${dateStr}`,
        task_id: task.id,
        task_name: task.name,
        task_duration: task.default_duration,
        task_difficulty: task.difficulty,
        task_category: task.category,
        task_tags: task.tags || [],
        pair_group: task.pair_group,
        date: dateStr,
        time_slot: timeSlot,
        status: 'scheduled'
      });
      occurrenceCount++;
    } else if (task.frequency === "monthly") {
      // Only schedule if week contains 1st-7th of month
      const weekStartDay = startDate.getDate();
      if (weekStartDay <= 7) {
        // Prefer mid-week for monthly tasks
        const date = new Date(startDate);
        date.setDate(Math.min(7, weekStartDay + 2));
        const dateStr = ymdLocal(date);
        
        const timeSlot = { start: "20:00", end: "21:00" }; // Evening slot for monthly tasks
        
        occurrences.push({
          id: `${task.id}-${dateStr}`,
          task_id: task.id,
          task_name: task.name,
          task_duration: task.default_duration,
          task_difficulty: task.difficulty,
          task_category: task.category,
          task_tags: task.tags || [],
          pair_group: task.pair_group,
          date: dateStr,
          time_slot: timeSlot,
          status: 'scheduled'
        });
        occurrenceCount++;
      }
    }
  }
  
  // Sort occurrences deterministically
  return occurrences.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time_slot.start !== b.time_slot.start) return a.time_slot.start.localeCompare(b.time_slot.start);
    return a.task_id.localeCompare(b.task_id);
  });
}

// Check if time slot conflicts with blackouts
function conflictsBlackout(adult: Adult, occurrence: Occurrence): boolean {
  if (!adult.blackout_slots) return false;
  
  const jsDay = new Date(occurrence.date).getDay();
  return adult.blackout_slots.some(b => {
    if (!Array.isArray(b.days) || !dayMatches(b.days, jsDay)) return false;
    const occStart = occurrence.time_slot.start;
    const occEnd = occurrence.time_slot.end;
    return occStart < b.end && occEnd > b.start;
  });
}

// Check if task is in no-go list
function isNoGo(adult: Adult, occurrence: Occurrence): boolean {
  if (!adult.no_go_tasks) return false;
  
  return adult.no_go_tasks.some(noGoTask => 
    occurrence.task_tags.includes(noGoTask) || occurrence.task_name.includes(noGoTask)
  );
}

// Check if task is disliked
function isDisliked(adult: Adult, occurrence: Occurrence): boolean {
  const dislikes = new Set(adult.disliked_tags || []);
  return occurrence.task_tags.some(t => dislikes.has(t));
}

// Check if occurrence exceeds evening hard caps
function exceedsEveningCaps(adult: Adult, occurrence: Occurrence, context: Context): boolean {
  // Check if this is an evening task (18:00-21:30)
  if (occurrence.time_slot.start < "18:00" || occurrence.time_slot.start > "21:30") return false;
  
  const dayOfWeek = new Date(occurrence.date).getDay();
  if (dayOfWeek < 1 || dayOfWeek > 5) return false; // Mon-Fri only
  
  const currentEveningMinutes = context.eveningLoad[adult.id]?.[occurrence.date] || 0;
  const currentEveningTasks = context.eveningTaskCount[adult.id]?.[occurrence.date] || 0;
  const units = occurrence.task_duration * DIFFICULTY_WEIGHTS[occurrence.task_difficulty];
  
  // Hard caps
  const wouldExceedMinutes = (currentEveningMinutes + units) > MAX_EVENING_MIN;
  const wouldExceedTasks = (currentEveningTasks + 1) > MAX_EVENING_TASKS;
  
  return wouldExceedMinutes && wouldExceedTasks;
}

// Check if occurrence exceeds weeknight cap (soft penalty)
function exceedsWeeknightCap(adult: Adult, occurrence: Occurrence, context: Context): boolean {
  const dayOfWeek = new Date(occurrence.date).getDay();
  if (dayOfWeek < 1 || dayOfWeek > 5) return false; // Mon..Fri
  const cap = (adult as any).weeknight_cap ?? WEEKNIGHT_CAP_DEFAULT;
  const current = context.weeknightLoad[adult.id] || 0;
  const units = occurrence.task_duration * DIFFICULTY_WEIGHTS[occurrence.task_difficulty];
  return (current + units) > cap;
}

// Check for same evening stacking (3rd task)
function stacksSameEvening(adult: Adult, occurrence: Occurrence, context: Context): boolean {
  if (occurrence.time_slot.start < "18:00" || occurrence.time_slot.start > "21:30") return false;
  
  const currentEveningTasks = context.eveningTaskCount[adult.id]?.[occurrence.date] || 0;
  return currentEveningTasks >= 2; // 3rd task would be stacking
}

// Check for paired task conflicts
function conflictsPairedTask(adult: Adult, occurrence: Occurrence, context: Context): boolean {
  if (!occurrence.pair_group) return false;
  
  // Check if same person already assigned to pair on same date
  const existingAssignment = context.pairAssignments[occurrence.pair_group]?.[occurrence.date];
  return existingAssignment === adult.id;
}

// Check alternating pattern preference
function violatesAlternatingPattern(adult: Adult, occurrence: Occurrence, context: Context): boolean {
  if (!occurrence.pair_group) return false;
  
  const pattern = context.weekPatterns[occurrence.pair_group]?.[adult.id];
  if (!pattern) return false;
  
  const dayOfWeek = new Date(occurrence.date).getDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[dayOfWeek];
  
  return !pattern.includes(dayName);
}

// Check ownership preference (task familiarity)
function matchesOwnership(adult: Adult, occurrence: Occurrence): boolean {
  // Simple ownership based on task category preference
  // This could be expanded with actual ownership data
  return false; // Placeholder
}

// Check if adult has many tasks same day
function hasTooManyTasksSameDay(adult: Adult, occurrence: Occurrence, context: Context): boolean {
  const currentDayCount = context.dailyTaskCount[adult.id]?.[occurrence.date] || 0;
  return currentDayCount >= SAME_DAY_TASK_LIMIT;
}

// Check preference match
function matchesPreference(adult: Adult, occurrence: Occurrence): boolean {
  // Could be expanded with preference tags
  return false;
}

// Check if adult has more remaining minutes
function hasMoreRemainingMinutes(adult: Adult, context: Context): boolean {
  const otherAdults = context.adults.filter(a => a.id !== adult.id);
  if (otherAdults.length === 0) return false;
  
  const adultRemaining = adult.weekly_time_budget - (context.load[adult.id] || 0);
  const otherAvgRemaining = otherAdults.reduce((sum, a) => {
    return sum + (a.weekly_time_budget - (context.load[a.id] || 0));
  }, 0) / otherAdults.length;
  
  return adultRemaining > (otherAvgRemaining + 20);
}

// Calculate candidate score
function candidateScore(adult: Adult, occurrence: Occurrence, context: Context): number {
  // Hard constraints - reject
  if (conflictsBlackout(adult, occurrence) || isNoGo(adult, occurrence)) {
    return Infinity;
  }
  
  // Evening hard caps - reject if both exceeded and no alternatives
  if (exceedsEveningCaps(adult, occurrence, context)) {
    return Infinity;
  }
  
  const units = occurrence.task_duration * DIFFICULTY_WEIGHTS[occurrence.task_difficulty];
  
  // Proportional fairness penalty
  const totalLoadAfter = context.totalLoad + units;
  const shareAfter = (context.load[adult.id] + units) / totalLoadAfter;
  const target = context.targetShare[adult.id];
  const penaltyFair = LAMBDA * Math.abs(shareAfter - target);
  
  // Soft constraints - tuned penalties
  let penalties = 0;
  if (exceedsWeeknightCap(adult, occurrence, context)) penalties += 5; // weeknight over-cap
  if (stacksSameEvening(adult, occurrence, context)) penalties += 4; // 3rd evening task stacking
  if (hasTooManyTasksSameDay(adult, occurrence, context)) penalties += 2; // day >2 tasks
  if (isDisliked(adult, occurrence)) penalties += 1; // disliked
  if (conflictsPairedTask(adult, occurrence, context)) penalties += 8; // paired task conflict
  if (violatesAlternatingPattern(adult, occurrence, context)) penalties += 8; // alternating violation
  
  // Check if only one evening cap exceeded (soft penalty)
  const dayOfWeek = new Date(occurrence.date).getDay();
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && occurrence.time_slot.start >= "18:00") {
    const currentEveningMinutes = context.eveningLoad[adult.id]?.[occurrence.date] || 0;
    const currentEveningTasks = context.eveningTaskCount[adult.id]?.[occurrence.date] || 0;
    const wouldExceedMinutes = (currentEveningMinutes + units) > MAX_EVENING_MIN;
    const wouldExceedTasks = (currentEveningTasks + 1) > MAX_EVENING_TASKS;
    
    if ((wouldExceedMinutes || wouldExceedTasks) && !(wouldExceedMinutes && wouldExceedTasks)) {
      penalties += 6; // soft penalty for single cap violation
    }
  }
  
  // Bonuses
  if (matchesPreference(adult, occurrence)) penalties -= 1;
  if (hasMoreRemainingMinutes(adult, context)) penalties -= 1;
  if (matchesOwnership(adult, occurrence)) penalties -= 3; // ownership bonus
  
  // Daytime flexibility bonus
  if (occurrence.time_slot.start < "18:00") {
    penalties -= 1; // basic daytime flexibility
    if (occurrence.time_slot.start >= "09:00" && occurrence.time_slot.start <= "17:00") {
      penalties -= 1; // additional bonus for business hours
    }
  }
  
  return penaltyFair + penalties;
}

// Generate explanation reasons
function generateReasons(adult: Adult, occurrence: Occurrence, context: Context): string[] {
  const reasons: string[] = [];
  
  if (hasMoreRemainingMinutes(adult, context)) {
    reasons.push("more_remaining");
  }
  
  const dayOfWeek = new Date(occurrence.date).getDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[dayOfWeek];
  
  if (WEEKNIGHTS.includes(dayName) && !exceedsEveningCaps(adult, occurrence, context)) {
    reasons.push("cap_ok");
  }
  
  if (!conflictsBlackout(adult, occurrence)) {
    reasons.push("avoid_blackout");
  }
  
  if (matchesPreference(adult, occurrence)) {
    reasons.push("preference_match");
  }
  
  if (!stacksSameEvening(adult, occurrence, context)) {
    reasons.push("avoid_stacking");
  }
  
  if (matchesOwnership(adult, occurrence)) {
    reasons.push("owner_task");
  }
  
  if (occurrence.pair_group && !violatesAlternatingPattern(adult, occurrence, context)) {
    reasons.push("rotated_pair");
  }
  
  if (occurrence.time_slot.start < "18:00") {
    reasons.push("daytime_flex");
  }
  
  return reasons;
}

// Update context after assignment
function updateContext(context: Context, adult: Adult, occurrence: Occurrence): void {
  const units = occurrence.task_duration * DIFFICULTY_WEIGHTS[occurrence.task_difficulty];
  
  context.load[adult.id] = (context.load[adult.id] || 0) + units;
  context.totalLoad += units;
  
  // Update weeknight load
  const dayOfWeek = new Date(occurrence.date).getDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[dayOfWeek];
  
  if (WEEKNIGHTS.includes(dayName)) {
    if (!context.weeknightLoad[adult.id]) context.weeknightLoad[adult.id] = 0;
    context.weeknightLoad[adult.id] += units;
  }
  
  // Update evening load and task count
  if (occurrence.time_slot.start >= "18:00" && occurrence.time_slot.start <= "21:30") {
    if (!context.eveningLoad[adult.id]) context.eveningLoad[adult.id] = {};
    if (!context.eveningLoad[adult.id][occurrence.date]) context.eveningLoad[adult.id][occurrence.date] = 0;
    context.eveningLoad[adult.id][occurrence.date] += units;
    
    if (!context.eveningTaskCount[adult.id]) context.eveningTaskCount[adult.id] = {};
    if (!context.eveningTaskCount[adult.id][occurrence.date]) context.eveningTaskCount[adult.id][occurrence.date] = 0;
    context.eveningTaskCount[adult.id][occurrence.date]++;
  }
  
  // Update daily task count
  if (!context.dailyTaskCount[adult.id]) context.dailyTaskCount[adult.id] = {};
  if (!context.dailyTaskCount[adult.id][occurrence.date]) context.dailyTaskCount[adult.id][occurrence.date] = 0;
  context.dailyTaskCount[adult.id][occurrence.date]++;
  
  // Update pair assignments
  if (occurrence.pair_group) {
    if (!context.pairAssignments[occurrence.pair_group]) context.pairAssignments[occurrence.pair_group] = {};
    context.pairAssignments[occurrence.pair_group][occurrence.date] = adult.id;
  }
}

// Tie-breaker for equal scores
function tieBreaker(adultA: Adult, adultB: Adult, occurrence: Occurrence, context: Context): number {
  // Higher remaining minutes
  const remainingA = adultA.weekly_time_budget - (context.load[adultA.id] || 0);
  const remainingB = adultB.weekly_time_budget - (context.load[adultB.id] || 0);
  
  if (remainingA !== remainingB) return remainingB - remainingA;
  
  // Fewer tasks that day
  const tasksA = context.dailyTaskCount[adultA.id]?.[occurrence.date] || 0;
  const tasksB = context.dailyTaskCount[adultB.id]?.[occurrence.date] || 0;
  
  if (tasksA !== tasksB) return tasksA - tasksB;
  
  // Lower person_id (stable)
  return adultA.id.localeCompare(adultB.id);
}

// Greedy assignment algorithm with backlog support
function greedyAssignment(occurrences: Occurrence[], adults: Adult[], idempotencyKey = ""): { assigned: Occurrence[], backlog: Occurrence[] } {
  const assigned: Occurrence[] = [];
  const backlog: Occurrence[] = [];
  
  // Initialize context
  const totalBudget = adults.reduce((sum, a) => sum + a.weekly_time_budget, 0);
  const context: Context = {
    adults,
    totalLoad: 0,
    load: {},
    targetShare: {},
    weeknightLoad: {},
    dailyTaskCount: {},
    eveningLoad: {},
    eveningTaskCount: {},
    pairAssignments: {},
    weekPatterns: {}
  };
  
  // Initialize alternating patterns for paired tasks (seeded)
  const seed = hashString(idempotencyKey || "default");
  const rng = seed % 2; // Simple alternation
  
  adults.forEach((adult, index) => {
    context.weekPatterns["daycare_dropoff"] = context.weekPatterns["daycare_dropoff"] || {};
    context.weekPatterns["daycare_pickup"] = context.weekPatterns["daycare_pickup"] || {};
    context.weekPatterns["bath_bedtime"] = context.weekPatterns["bath_bedtime"] || {};
    
    // Alternate: first adult gets Mon/Wed/Fri, second gets Tue/Thu, etc.
    if ((index + rng) % 2 === 0) {
      context.weekPatterns["daycare_dropoff"][adult.id] = ["Mon", "Wed", "Fri"];
      context.weekPatterns["daycare_pickup"][adult.id] = ["Mon", "Wed", "Fri"];
      context.weekPatterns["bath_bedtime"][adult.id] = ["Mon", "Wed", "Fri"];
    } else {
      context.weekPatterns["daycare_dropoff"][adult.id] = ["Tue", "Thu"];
      context.weekPatterns["daycare_pickup"][adult.id] = ["Tue", "Thu"];
      context.weekPatterns["bath_bedtime"][adult.id] = ["Tue", "Thu"];
    }
  });
  
  // Calculate target shares
  adults.forEach(adult => {
    context.targetShare[adult.id] = adult.weekly_time_budget / totalBudget;
    context.load[adult.id] = 0;
  });
  
  // Sort occurrences by priority (difficulty DESC, duration DESC)
  const sortedOccurrences = [...occurrences].sort((a, b) => {
    if (a.task_difficulty !== b.task_difficulty) return b.task_difficulty - a.task_difficulty;
    if (a.task_duration !== b.task_duration) return b.task_duration - a.task_duration;
    return a.id.localeCompare(b.id);
  });
  
  // Assign each occurrence
  for (const occurrence of sortedOccurrences) {
    let bestAdult: Adult | null = null;
    let bestScore = Infinity;
    
    // Find best adult for this occurrence
    for (const adult of adults) {
      const score = candidateScore(adult, occurrence, context);
      
      if (score < bestScore || (score === bestScore && bestAdult && tieBreaker(adult, bestAdult, occurrence, context) < 0)) {
        bestScore = score;
        bestAdult = adult;
      }
    }
    
    if (bestAdult && bestScore < Infinity) {
      // Assign to best adult
      const assignedOccurrence = {
        ...occurrence,
        assigned_person_id: bestAdult.id,
        assigned_person_name: bestAdult.first_name,
        rationale: {
          reasons: generateReasons(bestAdult, occurrence, context)
        }
      };
      
      assigned.push(assignedOccurrence);
      updateContext(context, bestAdult, occurrence);
    } else {
      // Move to backlog if no feasible candidate
      backlog.push({ ...occurrence, status: 'backlog' as const });
    }
  }
  
  return { assigned, backlog };
}

// Main fairness allocation function
function generateTaskAssignments(tasks: any[], people: any[], weekStart: string, idempotencyKey: string): any[] {
  const startTime = Date.now();
  
  // Filter adults
  const adults: Adult[] = people.filter((p: any) => p && (p.role === "adult" || !p.role));
  
  if (adults.length === 0) {
    console.warn("No adults found for assignment");
    return [];
  }
  
  // Stabilize inputs for determinism
  const { sortedTasks, sortedAdults } = stabilizeInputs(tasks, adults, idempotencyKey);
  
  // Expand tasks to occurrences
  const occurrences = expandTaskOccurrences(sortedTasks, weekStart);
  
  console.log(`Expanded ${occurrences.length} occurrences from ${sortedTasks.length} tasks`);
  
  // Greedy assignment
  const { assigned, backlog } = greedyAssignment(occurrences, sortedAdults, idempotencyKey);
  
  // Convert to expected format
  const assignments = assigned.map(occ => ({
    id: occ.id,
    task_id: occ.task_id,
    task_name: occ.task_name,
    task_duration: occ.task_duration,
    task_category: occ.task_category,
    date: occ.date,
    start_time: occ.time_slot.start,
    duration_min: occ.task_duration,
    difficulty_weight: DIFFICULTY_WEIGHTS[occ.task_difficulty],
    assigned_person_id: occ.assigned_person_id,
    assigned_person_name: occ.assigned_person_name,
    status: occ.status,
    rationale: occ.rationale
  }));
  
  // Runtime guard
  if (Date.now() - startTime > MAX_DURATION_MS) {
    console.warn("Allocator hit time budget; returning partial assignments");
  }
  
  // Log performance
  const duration = Date.now() - startTime;
  console.log({
    occ_total: assigned.length,
    backlog_count: backlog.length,
    duration_ms: duration
  });
  
  return assignments.sort((a, b) => a.date.localeCompare(b.date));
}

// Rebalance function to improve fairness with minimal changes
function generateRebalancePreview(tasks: any[], people: any[], currentAssignments: any[], weekStart: string, idempotencyKey: string): { assignments: any[], preview: any } {
  const adults: Adult[] = people.filter((p: any) => p && (p.role === "adult" || !p.role));
  if (adults.length < 2) {
    return { assignments: currentAssignments, preview: null };
  }

  // Calculate current fairness and loads
  const currentLoads: { [key: string]: number } = {};
  const currentAssignmentsByPerson: { [key: string]: any[] } = {};
  
  adults.forEach(adult => {
    currentLoads[adult.id] = 0;
    currentAssignmentsByPerson[adult.id] = [];
  });

  currentAssignments.forEach(assignment => {
    if (assignment.assigned_person_id && assignment.status === 'scheduled') {
      const task = tasks.find(t => t.id === assignment.task_id);
      const difficulty = task?.difficulty || 1;
      const units = assignment.task_duration * DIFFICULTY_WEIGHTS[difficulty];
      currentLoads[assignment.assigned_person_id] += units;
      currentAssignmentsByPerson[assignment.assigned_person_id].push(assignment);
    }
  });

  // Find potential swaps that improve fairness
  const changes: any[] = [];
  let bestAssignments = [...currentAssignments];
  let bestImprovement = 0;

  // Try swapping assignments between adults
  for (let i = 0; i < adults.length; i++) {
    for (let j = i + 1; j < adults.length; j++) {
      const adultA = adults[i];
      const adultB = adults[j];
      
      const assignmentsA = currentAssignmentsByPerson[adultA.id] || [];
      const assignmentsB = currentAssignmentsByPerson[adultB.id] || [];
      
      // Try swapping each assignment from A with each from B
      for (const assignmentA of assignmentsA) {
        for (const assignmentB of assignmentsB) {
          // Calculate fairness improvement
          const taskA = tasks.find(t => t.id === assignmentA.task_id);
          const taskB = tasks.find(t => t.id === assignmentB.task_id);
          
          if (!taskA || !taskB) continue;

          const unitsA = assignmentA.task_duration * DIFFICULTY_WEIGHTS[taskA.difficulty || 1];
          const unitsB = assignmentB.task_duration * DIFFICULTY_WEIGHTS[taskB.difficulty || 1];
          
          // Calculate new loads after swap
          const newLoadA = currentLoads[adultA.id] - unitsA + unitsB;
          const newLoadB = currentLoads[adultB.id] - unitsB + unitsA;
          
          // Calculate fairness improvement (simplified)
          const totalBudget = adults.reduce((sum, a) => sum + a.weekly_time_budget, 0);
          const totalLoad = Object.values(currentLoads).reduce((sum, load) => sum + load, 0);
          
          const currentDeviationA = Math.abs((currentLoads[adultA.id] / totalLoad) - (adultA.weekly_time_budget / totalBudget));
          const currentDeviationB = Math.abs((currentLoads[adultB.id] / totalLoad) - (adultB.weekly_time_budget / totalBudget));
          
          const newDeviationA = Math.abs((newLoadA / totalLoad) - (adultA.weekly_time_budget / totalBudget));
          const newDeviationB = Math.abs((newLoadB / totalLoad) - (adultB.weekly_time_budget / totalBudget));
          
          const improvement = (currentDeviationA + currentDeviationB) - (newDeviationA + newDeviationB);
          
          // If this swap improves fairness significantly
          if (improvement > 0.03 && improvement > bestImprovement) {
            bestImprovement = improvement;
            
            // Create new assignments with the swap
            bestAssignments = currentAssignments.map(assignment => {
              if (assignment.id === assignmentA.id) {
                return { ...assignment, assigned_person_id: adultB.id, assigned_person_name: adultB.first_name };
              }
              if (assignment.id === assignmentB.id) {
                return { ...assignment, assigned_person_id: adultA.id, assigned_person_name: adultA.first_name };
              }
              return assignment;
            });
            
            changes.splice(0, changes.length); // Clear previous changes
            changes.push({
              type: 'swap',
              fromPerson: adultA.first_name,
              toPerson: adultB.first_name,
              task: taskA.name,
              date: assignmentA.date
            });
            changes.push({
              type: 'swap',
              fromPerson: adultB.first_name,
              toPerson: adultA.first_name,
              task: taskB.name,
              date: assignmentB.date
            });
          }
        }
      }
    }
  }

  // Calculate projected fairness and adult loads
  const projectedLoads: { [key: string]: number } = {};
  adults.forEach(adult => { projectedLoads[adult.id] = 0; });
  
  bestAssignments.forEach(assignment => {
    if (assignment.assigned_person_id && assignment.status === 'scheduled') {
      const task = tasks.find(t => t.id === assignment.task_id);
      const difficulty = task?.difficulty || 1;
      const units = assignment.task_duration * DIFFICULTY_WEIGHTS[difficulty];
      projectedLoads[assignment.assigned_person_id] += units;
    }
  });

  const totalBudget = adults.reduce((sum, a) => sum + a.weekly_time_budget, 0);
  const totalCurrentLoad = Object.values(currentLoads).reduce((sum, load) => sum + load, 0);
  const totalProjectedLoad = Object.values(projectedLoads).reduce((sum, load) => sum + load, 0);

  // Calculate current and projected fairness scores
  let currentFairness = 85;
  let projectedFairness = 85;

  if (adults.length >= 2) {
    let currentDeviation = 0;
    let projectedDeviation = 0;
    
    adults.forEach(adult => {
      const targetShare = adult.weekly_time_budget / totalBudget;
      const currentShare = totalCurrentLoad > 0 ? currentLoads[adult.id] / totalCurrentLoad : 0;
      const projectedShare = totalProjectedLoad > 0 ? projectedLoads[adult.id] / totalProjectedLoad : 0;
      
      currentDeviation += Math.abs(currentShare - targetShare);
      projectedDeviation += Math.abs(projectedShare - targetShare);
    });
    
    currentFairness = Math.max(20, Math.min(98, Math.round(95 - (currentDeviation * 100))));
    projectedFairness = Math.max(20, Math.min(98, Math.round(95 - (projectedDeviation * 100))));
  }

  const preview = changes.length > 0 ? {
    currentFairness,
    projectedFairness,
    changes,
    adults: adults.map(adult => ({
      id: adult.id,
      name: adult.first_name,
      currentMinutes: Math.round(currentLoads[adult.id] || 0),
      projectedMinutes: Math.round(projectedLoads[adult.id] || 0),
      targetMinutes: adult.weekly_time_budget
    }))
  } : null;

  return { assignments: bestAssignments, preview };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract request ID for observability
  const rid = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Initialize user client for auth and membership checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('authorization') || '' }
      }
    });

    // Verify JWT and get user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error(`[plan-generate] auth failed`, { rid, authError });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const input = await req.json().catch(() => ({}));
    console.log(`[plan-generate] input received`, { rid, userId: user.id });

    const mode = input?.mode || 'generate';
    const currentAssignments = input?.current_assignments || [];
    const week_start = input?.week_start || new Date().toISOString().slice(0, 10);
    const household_id = input?.household_id || "HH_LOCAL";
    const timezone = input?.timezone || "Europe/Amsterdam";

    // Verify user is household member for real households
    if (household_id !== "HH_LOCAL") {
      const { data: membership, error: membershipError } = await userClient
        .from('household_members')
        .select('household_id')
        .eq('household_id', household_id)
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        console.error(`[plan-generate] membership check failed`, { rid, household_id, userId: user.id, membershipError });
        return new Response(JSON.stringify({ error: 'Not a member of this household' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const people = Array.isArray(input?.people) ? input.people : [];
    const tasks = Array.isArray(input?.tasks) ? input.tasks : [];
    
    console.log("Raw people:", people.length, people);
    console.log("Raw tasks:", tasks.length, tasks);

    // Get active task IDs and map to full task definitions
    const activeTaskIds = tasks.filter((t: any) => t && (t.active !== false && t.active !== 0)).map((t: any) => t.id);
    const fullActiveTasks = SEED_TASKS.filter(task => activeTaskIds.includes(task.id));
    const adults = people.filter((p: any) => p && (p.role === "adult" || !p.role));
    
    console.log("Active task IDs:", activeTaskIds.length, activeTaskIds);
    console.log("Full active tasks:", fullActiveTasks.length, fullActiveTasks);
    console.log("Filtered adults:", adults.length, adults);
    
    const plan_id = input?.idempotency_key || `${household_id}-${week_start}`;

    // Generate task assignments or rebalance existing ones
    let assignments, rebalancePreview = null;
    
    if (mode === 'rebalance_soft' && currentAssignments.length > 0) {
      const rebalanceResult = generateRebalancePreview(fullActiveTasks, adults, currentAssignments, week_start, plan_id);
      assignments = rebalanceResult.assignments;
      rebalancePreview = rebalanceResult.preview;
    } else {
      assignments = generateTaskAssignments(fullActiveTasks, adults, week_start, plan_id);
    }
    const occurrences = assignments.length;
    const backlogCount = assignments.filter(a => a.status === 'backlog').length;

    // Calculate proportional fairness score
    let fairness = 85;
    let fairness_adults: any[] = [];
    let contributors = {
      evenings_over_cap: {} as Record<string, number>,
      stacking_violations: {} as Record<string, number>,
      disliked_assignments: {} as Record<string, number>,
      pair_not_rotated: {} as Record<string, number>
    };
    let fairnessColor = 'yellow';
    const adult_loads: { [key: string]: { actual_minutes: number; target_minutes: number; share_percentage: number } } = {};
    
    if (adults.length >= 2) {
      const totalBudget = adults.reduce((sum, a) => sum + Number(a.weekly_time_budget || 0), 0);
      const actualLoads: { [key: string]: number } = {};
      
      // Calculate actual loads from assignments
      assignments.forEach(assignment => {
        if (assignment.assigned_person_id && assignment.status === 'scheduled') {
          const difficulty = fullActiveTasks.find(t => t.id === assignment.task_id)?.difficulty || 1;
          const units = assignment.task_duration * DIFFICULTY_WEIGHTS[difficulty];
          actualLoads[assignment.assigned_person_id] = (actualLoads[assignment.assigned_person_id] || 0) + units;
        }
      });
      
      const totalActualLoad = Object.values(actualLoads).reduce((sum, load) => sum + load, 0);
      
      // Calculate proportional fairness and detailed breakdown
      let totalDeviation = 0;
      fairness_adults = [];
      contributors = {
        evenings_over_cap: {} as Record<string, number>,
        stacking_violations: {} as Record<string, number>,
        disliked_assignments: {} as Record<string, number>,
        pair_not_rotated: {} as Record<string, number>
      };

      // Initialize contributor counters
      adults.forEach(adult => {
        contributors.evenings_over_cap[adult.id] = 0;
        contributors.stacking_violations[adult.id] = 0;
        contributors.disliked_assignments[adult.id] = 0;
        contributors.pair_not_rotated[adult.id] = 0;
      });

      // Track evening workload per person per date for accurate evening analysis
      const eveningWorkload: Record<string, Record<string, { count: number; minutes: number }>> = {};
      const pairTracker: Record<string, Record<string, string[]>> = {}; // track paired task assignments
      adults.forEach(adult => {
        eveningWorkload[adult.id] = {};
      });

      // Analyze assignments for contributors
      assignments.forEach(assignment => {
        if (assignment.status === 'backlog' || !assignment.assigned_person_id) return;
        
        const person = adults.find(a => a.id === assignment.assigned_person_id);
        if (!person) return;
        
        const assignmentDate = new Date(assignment.date);
        const dayOfWeek = assignmentDate.getDay(); // 0=Sunday, 1=Monday, etc.
        const isWeeknight = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
        
        // Check for disliked assignments
        const task = fullActiveTasks.find(t => t.id === assignment.task_id);
        if (task && person.disliked_tags) {
          const hasDislikedTag = task.tags.some(tag => person.disliked_tags.includes(tag));
          if (hasDislikedTag) {
            contributors.disliked_assignments[person.id]++;
          }
        }
        
        // Check if this is an evening task (18:00-21:30 on weeknights)
        const taskStartTime = "18:00"; // Default evening start for analysis
        const isEveningTask = isWeeknight && (
          assignment.task_category === 'childcare' ||
          assignment.task_name.toLowerCase().includes('diner') ||
          assignment.task_name.toLowerCase().includes('bedtijd') ||
          assignment.task_name.toLowerCase().includes('baddertijd')
        );
        
        if (isEveningTask) {
          const dateKey = assignment.date;
          if (!eveningWorkload[person.id][dateKey]) {
            eveningWorkload[person.id][dateKey] = { count: 0, minutes: 0 };
          }
          eveningWorkload[person.id][dateKey].count++;
          eveningWorkload[person.id][dateKey].minutes += assignment.task_duration;
        }
      });

      // Analyze evening workload patterns
      adults.forEach(adult => {
        const weeknightCap = adult.weeknight_cap || WEEKNIGHT_CAP_DEFAULT;
        const evenings = eveningWorkload[adult.id];
        
        Object.values(evenings).forEach(evening => {
          // Evening over cap violations
          if (evening.minutes > weeknightCap) {
            contributors.evenings_over_cap[adult.id]++;
          }
          
          // Stacking violations (3+ tasks or 60+ minutes in one evening)
          if (evening.count >= 3 || evening.minutes >= 60) {
            contributors.stacking_violations[adult.id]++;
          }
        });
      });

      adults.forEach(adult => {
        const targetShare = adult.weekly_time_budget / totalBudget;
        const actualLoad = actualLoads[adult.id] || 0;
        const actualShare = totalActualLoad > 0 ? actualLoad / totalActualLoad : 0;
        const deviation = Math.abs(actualShare - targetShare);
        totalDeviation += deviation;
        
        const actualMinutes = Math.round(actualLoad);
        const targetMinutes = Math.round((adult.weekly_time_budget / totalBudget) * totalActualLoad);
        
        adult_loads[adult.id] = {
          actual_minutes: actualMinutes,
          target_minutes: adult.weekly_time_budget,
          share_percentage: Math.round(actualShare * 100)
        };
        
        const actualPoints = Math.round(actualLoad);
        const targetPoints = Math.round(targetShare * totalActualLoad);
        
        fairness_adults.push({
          person_id: adult.id,
          actual_minutes: actualMinutes,
          actual_points: actualPoints,
          target_minutes: targetMinutes,
          target_points: targetPoints,
          actual_share: Math.round(actualShare * 100) / 100,
          target_share: Math.round(targetShare * 100) / 100,
          delta_minutes: actualMinutes - targetMinutes,
          delta_share: Math.round((actualShare - targetShare) * 100) / 100
        });
      });
      
      // Convert to 0-100 score with soft cap
      fairness = Math.max(20, Math.min(98, Math.round(95 - (totalDeviation * 100))));
      
      // Determine color based on score
      fairnessColor = fairness >= 80 ? 'green' : fairness >= 60 ? 'yellow' : 'red';
    }

    const data = { 
      version: "2025-08-14",
      plan_id, 
      week_start, 
      occurrences, 
      backlog: backlogCount,
      fairness, 
      fairness_details: {
        adults: fairness_adults,
        contributors,
        color: fairnessColor
      },
      timezone,
      assignments,
      people: adults,
      tasks: activeTaskIds.map(id => ({ id, active: true })),
      backlog_count: backlogCount,
      adult_loads,
      ...(rebalancePreview && { rebalance_preview: rebalancePreview })
    };

    // Persist plan to database for real users (not demo mode)
    if (!mode || mode === 'generate') {
      if (household_id !== "HH_LOCAL" && assignments?.length > 0) {
        try {
          // Create service client for writes (bypass RLS)
          const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
          
          // Upsert plan record with correct enum value
          const { data: upsertedPlan, error: planError } = await serviceClient
            .from('plans')
            .upsert(
              {
                household_id,
                week_start,
                fairness_score: fairness || 0,
                status: 'confirmed', // Use valid enum value
                created_by: user.id
              },
              { onConflict: 'household_id,week_start' }
            )
            .select('id, household_id, week_start')
            .single();

          if (planError) {
            console.error(`[plan-generate] plan upsert failed`, { rid, planError });
            return new Response(JSON.stringify({ error: 'plan_upsert_failed', details: planError }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const dbPlanId = upsertedPlan.id;

          // Delete existing occurrences for idempotency
          const { error: deleteError } = await serviceClient
            .from('occurrences')
            .delete()
            .eq('plan_id', dbPlanId);

          if (deleteError) {
            console.error(`[plan-generate] occurrences delete failed`, { rid, deleteError });
          }

          // Bulk insert new occurrences
          const bulkOccurrences = assignments.map((assignment: any) => ({
            plan_id: dbPlanId,
            task_id: assignment.task_id,
            date: assignment.date,
            assigned_person: assignment.assigned_person_id || null,
            status: 'scheduled',
            start_time: assignment.time_slot?.start || '18:30',
            duration_min: assignment.task_duration || 30,
            difficulty_weight: (assignment.task_difficulty || 1) * 1.0,
            reminder_level: 0,
            is_critical: false,
            rationale: assignment.rationale ? JSON.stringify(assignment.rationale) : null
          }));

          if (bulkOccurrences.length > 0) {
            const { error: occError } = await serviceClient
              .from('occurrences')
              .insert(bulkOccurrences);

            if (occError) {
              console.error(`[plan-generate] occurrences insert failed`, { rid, occError });
              return new Response(JSON.stringify({ error: 'occurrences_insert_failed', details: occError }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }

          console.log(`[plan-generate] persisted`, { rid, userId: user.id, household_id, week_start, plan_id: dbPlanId, count: bulkOccurrences.length });

          // Return minimal response for database persistence
          return new Response(JSON.stringify({
            plan_id: dbPlanId,
            household_id,
            week_start,
            occurrence_count: bulkOccurrences.length,
            success: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.error(`[plan-generate] database persistence error`, { rid, dbError });
          return new Response(JSON.stringify({ error: 'database_persistence_failed', details: dbError }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`[plan-generate] error`, { rid, error: error?.message || error });
    return new Response(JSON.stringify({ error: error?.message || "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
