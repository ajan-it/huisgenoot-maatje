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
  { id: "t1", name: "Ontbijt voorbereiden", category: "kitchen", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["kitchen","meals"], packs: ["pack_two_workers"], location: "indoor" },
  { id: "t2", name: "Opruimen na ontbijt", category: "kitchen", default_duration: 15, difficulty: 1, frequency: "daily", tags: ["kitchen"], packs: ["pack_two_workers"], location: "indoor" },
  { id: "t3", name: "Broodtrommels klaarmaken", category: "kitchen", default_duration: 10, difficulty: 1, frequency: "daily", tags: ["kitchen","school"], packs: ["pack_schoolkids"], location: "indoor" },
  { id: "t4", name: "Maaltijden plannen", category: "admin", default_duration: 25, difficulty: 2, frequency: "weekly", tags: ["planning"], location: "indoor" },
  { id: "t5", name: "Diner bereiden", category: "kitchen", default_duration: 45, difficulty: 2, frequency: "daily", tags: ["meals"], location: "indoor" },
  { id: "t6", name: "Gezinsdiner & opruimen", category: "kitchen", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["meals"], location: "indoor" },
  
  // Was & kleding
  { id: "t7", name: "Was starten", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["laundry"], location: "indoor" },
  { id: "t8", name: "In droger / ophangen", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["laundry"], location: "indoor" },
  { id: "t9", name: "Wassen vouwen & opruimen", category: "cleaning", default_duration: 25, difficulty: 2, frequency: "weekly", tags: ["laundry"], location: "indoor" },
  { id: "t10", name: "Bedden verschonen", category: "cleaning", default_duration: 30, difficulty: 2, frequency: "weekly", tags: ["bedroom"], location: "indoor" },
  
  // Schoonmaken & huishouden
  { id: "t11", name: "Slaapkamers opruimen & stofzuigen", category: "cleaning", default_duration: 30, difficulty: 2, frequency: "weekly", tags: ["cleaning"], location: "indoor" },
  { id: "t12", name: "Wekelijkse schoonmaak (badkamer, dweilen)", category: "cleaning", default_duration: 60, difficulty: 3, frequency: "weekly", tags: ["bathroom","floors"], location: "indoor" },
  { id: "t13", name: "15-minuten reset (opruimen)", category: "cleaning", default_duration: 15, difficulty: 1, frequency: "weekly", tags: ["declutter"], location: "indoor" },
  { id: "t14", name: "Koelkast/keuken diepteren", category: "kitchen", default_duration: 45, difficulty: 3, frequency: "monthly", tags: ["deepclean"], location: "indoor" },
  
  // Kinderzorg & routine  
  { id: "t15", name: "Dagopvang brengen (ochtend)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"], packs: ["pack_toddler", "pack_schoolkids"], pair_group: "daycare_dropoff" },
  { id: "t16", name: "Dagopvang ophalen (middag)", category: "childcare", default_duration: 30, difficulty: 2, frequency: "daily", tags: ["transport"], packs: ["pack_toddler", "pack_schoolkids"], pair_group: "daycare_pickup" },
  { id: "t17", name: "Baddertijd", category: "childcare", default_duration: 25, difficulty: 1, frequency: "daily", tags: ["routine"], packs: ["pack_toddler", "pack_schoolkids"], location: "indoor", pair_group: "bath_bedtime" },
  { id: "t18", name: "Voorlezen / bedtijd", category: "childcare", default_duration: 20, difficulty: 1, frequency: "daily", tags: ["routine"], packs: ["pack_toddler", "pack_schoolkids"], location: "indoor", pair_group: "bath_bedtime" },
  
  // Boodschappen & klusjes
  { id: "t19", name: "Boodschappen doen", category: "errands", default_duration: 40, difficulty: 2, frequency: "weekly", tags: ["shopping"] },
  { id: "t20", name: "Apotheek", category: "errands", default_duration: 20, difficulty: 1, frequency: "monthly", tags: ["errands"] },
  
  // Beheer
  { id: "t21", name: "Rekeningen betalen", category: "admin", default_duration: 20, difficulty: 2, frequency: "monthly", tags: ["finance"], location: "indoor" },
  { id: "t22", name: "Afval & recycling buiten zetten (GFT/PMD/rest)", category: "cleaning", default_duration: 10, difficulty: 1, frequency: "weekly", tags: ["waste"], location: "outdoor" },
  { id: "t23", name: "Vaatwasser uitruimen / afdrogen", category: "kitchen", default_duration: 10, difficulty: 1, frequency: "daily", tags: ["dishes"], location: "indoor" },
  
  // Sociaal & zelfzorg
  { id: "t24", name: "Koppeltijd / self-care", category: "selfcare", default_duration: 60, difficulty: 1, frequency: "weekly", tags: ["selfcare"], location: "indoor" },

  // Apparaat onderhoud
  { id: "a1", name: "Droger: pluizenfilter schoonmaken", category: "appliance", default_duration: 5, difficulty: 1, frequency: "daily", tags: ["appliance", "safety"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Maak pluizenfilter na elke droogbeurt schoon (brandveiligheid)" },
  { id: "a2", name: "Droger: condensor/ruimte reinigen", category: "appliance", default_duration: 15, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Condensor maandelijks reinigen voor optimale werking" },
  { id: "a3", name: "Vaatwasser: filters reinigen", category: "appliance", default_duration: 15, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Reinig filters maandelijks voor betere werking" },
  { id: "a4", name: "Afzuigkap: vetfilters reinigen/vervangen", category: "appliance", default_duration: 20, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Filters maandelijks reinigen; vervang indien nodig" },
  { id: "a5", name: "Oven: grondig reinigen", category: "appliance", default_duration: 50, difficulty: 3, frequency: "quarterly", tags: ["appliance", "deepclean"], packs: ["pack_appliance_maint"], location: "indoor" },
  { id: "a6", name: "Koelkast: binnenkant schoonmaken", category: "appliance", default_duration: 20, difficulty: 2, frequency: "quarterly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Koelkast om de 1-3 maanden schoonmaken voor hygiëne" },
  { id: "a7", name: "Koelkast: rooster/condensor stofzuigen", category: "appliance", default_duration: 15, difficulty: 2, frequency: "annual", tags: ["appliance", "energy"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Jaarlijks achterrooster stofvrij maken voor lager verbruik" },
  { id: "a8", name: "Vriezer: ontdooien", category: "appliance", default_duration: 45, difficulty: 3, frequency: "semiannual", tags: ["appliance", "seasonal"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Ontdooi vriezer 1-2×/jaar om energie te besparen" },
  { id: "a9", name: "Koffiemachine: ontkalken", category: "appliance", default_duration: 20, difficulty: 2, frequency: "biweekly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Om de 2-3 maanden ontkalken, afhankelijk van waterhardheid" },
  { id: "a10", name: "Waterkoker: ontkalken", category: "appliance", default_duration: 10, difficulty: 1, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Maandelijks tot per kwartaal ontkalken bij hard water" },
  { id: "a11", name: "Afzuigkap: behuizing/roosters ontvetten", category: "appliance", default_duration: 15, difficulty: 2, frequency: "monthly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor" },

  // Veiligheid
  { id: "s1", name: "Rookmelders: testen", category: "safety", default_duration: 2, difficulty: 1, frequency: "monthly", tags: ["safety"], packs: ["pack_safety_checks"], location: "indoor", helper_text: "Test rookmelders maandelijks; vervang batterij jaarlijks" },
  { id: "s2", name: "Rookmelders: batterij vervangen", category: "safety", default_duration: 5, difficulty: 1, frequency: "annual", tags: ["safety"], packs: ["pack_safety_checks"], location: "indoor", helper_text: "Vervang batterij jaarlijks of gebruik 10-jaars batterij" },
  { id: "s3", name: "CV-ketel: onderhoudsbeurt", category: "safety", default_duration: 60, difficulty: 3, frequency: "annual", tags: ["safety", "appliance", "external"], packs: ["pack_safety_checks"], location: "indoor", helper_text: "Jaarlijks onderhoud door monteur (zeker bij oudere ketels)" },
  { id: "s4", name: "CV-ketel: waterdruk controleren/bijvullen", category: "appliance", default_duration: 10, difficulty: 2, frequency: "quarterly", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Controleer waterdruk per kwartaal; vul bij indien nodig" },
  { id: "s5", name: "Mechanische ventilatie: ventielen reinigen", category: "appliance", default_duration: 20, difficulty: 2, frequency: "annual", tags: ["appliance", "air"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Ventielen jaarlijks reinigen voor goede luchtkwaliteit" },
  { id: "s6", name: "Mechanische ventilatie: motor onderhoud", category: "appliance", default_duration: 60, difficulty: 3, frequency: "biweekly", tags: ["appliance", "air", "external"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Motor 2-jaarlijks laten onderhouden door monteur" },
  { id: "s7", name: "Ventilatiekanalen laten reinigen", category: "appliance", default_duration: 120, difficulty: 3, frequency: "custom", tags: ["appliance", "air", "external"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Kanalen ±8-jaarlijks professioneel laten reinigen" },
  
  // Buitenonderhoud
  { id: "o1", name: "Dakgoot schoonmaken", category: "outdoor", default_duration: 40, difficulty: 3, frequency: "semiannual", tags: ["outdoor", "seasonal"], packs: ["pack_house_garden", "pack_season_spring", "pack_season_autumn"], location: "outdoor", helper_text: "1-2× per jaar: lente + na bladval" },
  { id: "o2", name: "Fiets: ketting smeren/banden op spanning", category: "maintenance", default_duration: 10, difficulty: 1, frequency: "monthly", tags: ["cycling"], packs: ["pack_cycling"], location: "outdoor" },
  { id: "o3", name: "Auto: banden & vloeistoffen check", category: "maintenance", default_duration: 10, difficulty: 2, frequency: "monthly", tags: ["car"], packs: ["pack_car"], location: "outdoor" },
  { id: "o4", name: "Schoorsteen vegen (open haard)", category: "safety", default_duration: 60, difficulty: 3, frequency: "annual", tags: ["safety", "seasonal", "external"], packs: ["pack_fireplace"], location: "indoor", helper_text: "Jaarlijks door schoorsteenveger (verplicht)" },
  { id: "o5", name: "Zonwering/horren check & schoonmaak", category: "outdoor", default_duration: 30, difficulty: 2, frequency: "seasonal", tags: ["outdoor", "seasonal"], packs: ["pack_season_spring"], location: "outdoor" },
  { id: "o6", name: "Zonnepanelen inspectie/afspoelen", category: "outdoor", default_duration: 30, difficulty: 2, frequency: "annual", tags: ["outdoor"], packs: ["pack_solar"], location: "outdoor", helper_text: "Jaarlijks afspoelen indien zichtbaar vuil" },
  
  // Seizoensgebonden
  { id: "sea1", name: "Tuin: seizoensklaar maken (lente)", category: "garden", default_duration: 90, difficulty: 3, frequency: "seasonal", tags: ["garden", "seasonal"], packs: ["pack_house_garden", "pack_season_spring"], location: "outdoor" },
  { id: "sea2", name: "Tuin: winterklaar maken (herfst)", category: "garden", default_duration: 60, difficulty: 3, frequency: "seasonal", tags: ["garden", "seasonal"], packs: ["pack_house_garden", "pack_season_autumn"], location: "outdoor" },
  { id: "sea3", name: "Winterkleding ophalen/wegbergen", category: "cleaning", default_duration: 45, difficulty: 2, frequency: "seasonal", tags: ["seasonal"], packs: ["pack_season_spring", "pack_season_autumn"], location: "indoor" },

  // New pack entry points
  { id: "pack_app", name: "🔧 Apparaat-onderhoud", category: "appliance", default_duration: 0, difficulty: 1, frequency: "custom", tags: ["appliance"], packs: ["pack_appliance_maint"], location: "indoor", helper_text: "Klik om apparaat onderhoudstaken toe te voegen" },
  { id: "pack_seas", name: "🍂 Seizoenscheck", category: "seasonal", default_duration: 0, difficulty: 1, frequency: "custom", tags: ["seasonal"], packs: ["pack_season_spring", "pack_season_autumn"], location: "outdoor", helper_text: "Klik om seizoensgebonden taken toe te voegen" },
];
