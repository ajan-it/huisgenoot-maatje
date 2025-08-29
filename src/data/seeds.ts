import { Task } from "@/types/models";

export interface BlackoutTemplate {
  label: string;
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  start: string; // 24h HH:mm
  end: string;   // 24h HH:mm
  description?: string;
}

export const SEED_BLACKOUTS: BlackoutTemplate[] = [
  { label: "Workday (Mon–Fri 09:00–17:30)", days: ["Mon","Tue","Wed","Thu","Fri"], start: "09:00", end: "17:30" },
  { label: "Morning rush (Mon–Fri 07:30–08:45)", days: ["Mon","Tue","Wed","Thu","Fri"], start: "07:30", end: "08:45" },
  { label: "Evening rush & pickup (Mon–Fri 17:00–18:30)", days: ["Mon","Tue","Wed","Thu","Fri"], start: "17:00", end: "18:30" },
  { label: "Bedtime routine (daily 19:00–20:00)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "19:00", end: "20:00" },
  { label: "Toddler nap (13:00–15:00)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "13:00", end: "15:00" },
  { label: "Self-care (sports/meditation)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "20:00", end: "21:00" },
  { label: "Weekend activities", days: ["Sat","Sun"], start: "10:00", end: "12:00" },
  { label: "Sleep time (21:00–07:00)", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "21:00", end: "07:00" },
  { label: "Sick / travel", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], start: "00:00", end: "23:59" },
];

export const SEED_TASKS: Task[] = [
  // Kitchen & meals
  { id: "t1", name: "Breakfast preparation", category: "kitchen", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["kitchen","meals"], packs: ["pack_two_workers"], location: "indoor" },
  { id: "t2", name: "Cleanup after breakfast", category: "kitchen", default_duration: 15, difficulty: 1, frequency: "daily", tags: ["kitchen"], packs: ["pack_two_workers"], location: "indoor" },
  { id: "t3", name: "Making lunch boxes", category: "kitchen", default_duration: 10, difficulty: 1, frequency: "daily", tags: ["kitchen","school"], packs: ["pack_schoolkids"], location: "indoor" },
  { id: "t4", name: "Meal planning", category: "admin", default_duration: 25, difficulty: 2, frequency: "weekly", tags: ["planning"], location: "indoor" },
  { id: "t5", name: "Dinner preparation", category: "kitchen", default_duration: 45, difficulty: 2, frequency: "daily", tags: ["meals"], location: "indoor" },
  { id: "t6", name: "Family dinner & cleanup", category: "kitchen", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["meals"], location: "indoor" },
  
  // Laundry & clothing
  { id: "t7", name: "Start laundry", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["laundry"], location: "indoor" },
  { id: "t8", name: "Into dryer / hang up", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["laundry"], location: "indoor" },
  { id: "t9", name: "Fold laundry & put away", category: "cleaning", default_duration: 25, difficulty: 2, frequency: "weekly", tags: ["laundry"], location: "indoor" },
  { id: "t10", name: "Change bed sheets", category: "cleaning", default_duration: 30, difficulty: 2, frequency: "weekly", tags: ["bedroom"], location: "indoor" },
  
  // Cleaning & household
  { id: "t11", name: "Tidy bedrooms & vacuum", category: "cleaning", default_duration: 30, difficulty: 2, frequency: "weekly", tags: ["cleaning"], location: "indoor" },
  { id: "t12", name: "Weekly cleaning (bathroom, mopping)", category: "cleaning", default_duration: 60, difficulty: 3, frequency: "weekly", tags: ["bathroom","floors"], location: "indoor" },
  { id: "t13", name: "15-minute reset (tidying)", category: "cleaning", default_duration: 15, difficulty: 1, frequency: "weekly", tags: ["declutter"], location: "indoor" },
  { id: "t14", name: "Deep clean fridge/kitchen", category: "kitchen", default_duration: 45, difficulty: 3, frequency: "monthly", tags: ["deepclean"], location: "indoor" },
  
  // Childcare & routine
  { id: "t15", name: "Daycare drop-off (morning)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"], packs: ["pack_toddler", "pack_schoolkids"], pair_group: "daycare_dropoff", location: "outdoor" },
  { id: "t16", name: "Daycare pickup (afternoon)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"], packs: ["pack_toddler", "pack_schoolkids"], pair_group: "daycare_pickup", location: "outdoor" },
  { id: "t17", name: "Bath time", category: "childcare", default_duration: 25, difficulty: 1, frequency: "daily", tags: ["routine"], packs: ["pack_toddler", "pack_schoolkids"], location: "indoor", pair_group: "bath_bedtime" },
  { id: "t18", name: "Reading / bedtime", category: "childcare", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["routine"], packs: ["pack_toddler", "pack_schoolkids"], location: "indoor", pair_group: "bath_bedtime" },
  
  // Errands & tasks
  { id: "t19", name: "Grocery shopping", category: "errands", default_duration: 40, difficulty: 2, frequency: "weekly", tags: ["shopping"], location: "outdoor" },
  { id: "t20", name: "Pharmacy", category: "errands", default_duration: 20, difficulty: 1, frequency: "monthly", tags: ["errands"], location: "outdoor" },
  
  // Administration
  { id: "t21", name: "Pay bills", category: "admin", default_duration: 20, difficulty: 2, frequency: "monthly", tags: ["finance"], location: "indoor" },
  { id: "t22", name: "Put out trash & recycling (organic/plastic/general)", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["waste"], location: "outdoor" },
  { id: "t23", name: "Empty dishwasher / dry dishes", category: "kitchen", default_duration: 10, difficulty: 1, frequency: "daily", tags: ["dishes"], location: "indoor" },
  
  // Social & self-care
  { id: "t24", name: "Couple time / self-care", category: "selfcare", default_duration: 60, difficulty: 1, frequency: "weekly", tags: ["selfcare"], location: "indoor" },

  // Appliance maintenance
  { id: "a1", name: "Dryer: clean lint filter", category: "appliance", default_duration: 5, difficulty: 1, frequency: "daily", tags: ["appliance", "safety"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Clean lint filter after each drying cycle (fire safety)" },
  { id: "a2", name: "Dryer: clean condenser/space", category: "appliance", default_duration: 15, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Clean condenser monthly for optimal operation" },
  { id: "a3", name: "Dishwasher: clean filters", category: "appliance", default_duration: 15, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Clean filters monthly for better performance" },
  { id: "a4", name: "Range hood: clean/replace grease filters", category: "appliance", default_duration: 20, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Clean filters monthly; replace if needed" },
  { id: "a5", name: "Oven: deep clean", category: "appliance", default_duration: 50, difficulty: 3, frequency: "quarterly", tags: ["appliance", "deepclean"], packs: ["pack_appliance_maint"], location: "indoor" },
  { id: "a6", name: "Refrigerator: clean inside", category: "appliance", default_duration: 20, difficulty: 2, frequency: "quarterly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Clean refrigerator every 1-3 months for hygiene" },
  { id: "a7", name: "Refrigerator: vacuum coils/condenser", category: "appliance", default_duration: 15, difficulty: 2, frequency: "annual", tags: ["appliance", "energy"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Vacuum rear coils annually for lower energy use" },
  { id: "a8", name: "Freezer: defrost", category: "appliance", default_duration: 45, difficulty: 3, frequency: "semiannual", tags: ["appliance", "seasonal"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Defrost freezer 1-2×/year to save energy" },
  { id: "a9", name: "Coffee machine: descale", category: "appliance", default_duration: 20, difficulty: 2, frequency: "biweekly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Descale every 2-3 months, depending on water hardness" },
  { id: "a10", name: "Kettle: descale", category: "appliance", default_duration: 10, difficulty: 1, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Descale monthly to quarterly with hard water" },
  { id: "a11", name: "Range hood: degrease housing/vents", category: "appliance", default_duration: 15, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor" },

  // Safety
  { id: "s1", name: "Smoke detectors: test", category: "safety", default_duration: 2, difficulty: 1, frequency: "monthly", tags: ["safety"], packs: ["pack_safety_checks"], location: "indoor", helper_text: "Test smoke detectors monthly; replace battery annually" },
  { id: "s2", name: "Smoke detectors: replace battery", category: "safety", default_duration: 5, difficulty: 1, frequency: "annual", tags: ["safety"], packs: ["pack_safety_checks"], location: "indoor", helper_text: "Replace battery annually or use 10-year battery" },
  { id: "s3", name: "Boiler: annual maintenance", category: "safety", default_duration: 60, difficulty: 3, frequency: "annual", tags: ["safety", "appliance", "external"], packs: ["pack_safety_checks"], location: "indoor", helper_text: "Annual maintenance by technician (especially for older boilers)" },
  { id: "s4", name: "Boiler: check/refill water pressure", category: "appliance", default_duration: 10, difficulty: 2, frequency: "quarterly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Check water pressure quarterly; refill if needed" },
  { id: "s5", name: "Mechanical ventilation: clean vents", category: "appliance", default_duration: 20, difficulty: 2, frequency: "annual", tags: ["appliance", "air"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Clean vents annually for good air quality" },
  { id: "s6", name: "Mechanical ventilation: motor maintenance", category: "appliance", default_duration: 60, difficulty: 3, frequency: "biweekly", tags: ["appliance", "air", "external"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Have motor serviced by technician every 2 years" },
  { id: "s7", name: "Have ventilation ducts cleaned", category: "appliance", default_duration: 120, difficulty: 3, frequency: "custom", tags: ["appliance", "air", "external"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Have ducts professionally cleaned ±every 8 years" },
  
  // Outdoor maintenance
  { id: "o1", name: "Clean gutters", category: "outdoor", default_duration: 40, difficulty: 3, frequency: "semiannual", tags: ["outdoor", "seasonal"], packs: ["pack_house_garden", "pack_season_spring", "pack_season_autumn"], location: "outdoor", helper_text: "1-2× per year: spring + after leaf fall" },
  { id: "o2", name: "Bike: oil chain/check tire pressure", category: "maintenance", default_duration: 10, difficulty: 1, frequency: "monthly", tags: ["cycling"], packs: ["pack_cycling"], location: "outdoor" },
  { id: "o3", name: "Car: check tires & fluids", category: "maintenance", default_duration: 10, difficulty: 2, frequency: "monthly", tags: ["car"], packs: ["pack_car"], location: "outdoor" },
  { id: "o4", name: "Chimney cleaning (fireplace)", category: "safety", default_duration: 60, difficulty: 3, frequency: "annual", tags: ["safety", "seasonal", "external"], packs: ["pack_fireplace"], location: "indoor", helper_text: "Annual cleaning by chimney sweep (mandatory)" },
  { id: "o5", name: "Awnings/screens check & clean", category: "outdoor", default_duration: 30, difficulty: 2, frequency: "seasonal", tags: ["outdoor", "seasonal"], packs: ["pack_season_spring"], location: "outdoor" },
  { id: "o6", name: "Solar panels inspection/rinse", category: "outdoor", default_duration: 30, difficulty: 2, frequency: "annual", tags: ["outdoor"], packs: ["pack_solar"], location: "outdoor", helper_text: "Rinse annually if visibly dirty" },
  
  // Seasonal
  { id: "sea1", name: "Garden: spring preparation", category: "garden", default_duration: 90, difficulty: 3, frequency: "seasonal", tags: ["garden", "seasonal"], packs: ["pack_house_garden", "pack_season_spring"], location: "outdoor" },
  { id: "sea2", name: "Garden: winter preparation", category: "garden", default_duration: 60, difficulty: 3, frequency: "seasonal", tags: ["garden", "seasonal"], packs: ["pack_house_garden", "pack_season_autumn"], location: "outdoor" },
  { id: "sea3", name: "Winter clothing get/put away", category: "cleaning", default_duration: 45, difficulty: 2, frequency: "seasonal", tags: ["seasonal"], packs: ["pack_season_spring", "pack_season_autumn"], location: "indoor" },

  // New pack entry points
  { id: "pack_app", name: "🔧 Appliance maintenance", category: "appliance", default_duration: 0, difficulty: 1, frequency: "custom", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Click to add appliance maintenance tasks" },
  { id: "pack_seas", name: "🍂 Seasonal check", category: "seasonal", default_duration: 0, difficulty: 1, frequency: "custom", tags: ["seasonal"], packs: ["pack_season_spring", "pack_season_autumn"], location: "outdoor", helper_text: "Click to add seasonal tasks" },
];
