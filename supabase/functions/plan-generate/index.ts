import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

function generateTaskAssignments(tasks: any[], people: any[], weekStart: string): any[] {
  const assignments: any[] = [];
  const startDate = new Date(weekStart);
  
  // Get weekly tasks and create assignments
  const weeklyTasks = tasks.filter(t => t.frequency === 'weekly');
  const dailyTasks = tasks.filter(t => t.frequency === 'daily');
  
  // Assign weekly tasks randomly across the week
  weeklyTasks.forEach((task, index) => {
    const dayOffset = (index * 2) % 7; // Spread across week
    const assignedDate = new Date(startDate);
    assignedDate.setDate(assignedDate.getDate() + dayOffset);
    
    // Round-robin assignment to people
    const assignedPerson = people[index % people.length];
    
    assignments.push({
      id: `${task.id}-${weekStart}-${dayOffset}`,
      task_id: task.id,
      task_name: task.name,
      task_duration: task.default_duration,
      task_category: task.category,
      date: assignedDate.toISOString().split('T')[0],
      assigned_person_id: assignedPerson.id,
      assigned_person_name: assignedPerson.first_name,
      status: 'scheduled'
    });
  });
  
  // Assign daily tasks (just for workdays to keep it manageable)
  const workDays = [1, 2, 3, 4, 5]; // Mon-Fri
  dailyTasks.forEach((task) => {
    workDays.forEach((dayOffset) => {
      const assignedDate = new Date(startDate);
      assignedDate.setDate(assignedDate.getDate() + dayOffset - 1);
      
      // Alternate between people for daily tasks
      const personIndex = dayOffset % people.length;
      const assignedPerson = people[personIndex];
      
      assignments.push({
        id: `${task.id}-${weekStart}-${dayOffset}`,
        task_id: task.id,
        task_name: task.name,
        task_duration: task.default_duration,
        task_category: task.category,
        date: assignedDate.toISOString().split('T')[0],
        assigned_person_id: assignedPerson.id,
        assigned_person_name: assignedPerson.first_name,
        status: 'scheduled'
      });
    });
  });
  
  return assignments.sort((a, b) => a.date.localeCompare(b.date));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = await req.json().catch(() => ({}));
    console.log("Input received:", JSON.stringify(input, null, 2));

    const week_start = input?.week_start || new Date().toISOString().slice(0, 10);
    const household_id = input?.household_id || "HH_LOCAL";
    const timezone = input?.timezone || "Europe/Amsterdam";

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
    
    // Calculate fairness score
    let fairness = 85;
    if (adults.length >= 2) {
      const budgets = adults.map((a: any) => Number(a?.weekly_time_budget || 0));
      const max = Math.max(...budgets, 1);
      const min = Math.min(...budgets, 0);
      const diff = max - min;
      fairness = Math.max(50, Math.min(98, Math.round(98 - (diff / (max || 1)) * 30)));
    }

    // Generate task assignments
    const assignments = generateTaskAssignments(fullActiveTasks, adults, week_start);
    const occurrences = assignments.length;

    const plan_id = input?.idempotency_key || `${household_id}-${week_start}`;

    const data = { 
      plan_id, 
      week_start, 
      occurrences, 
      fairness, 
      timezone,
      assignments,
      people: adults,
      tasks: activeTaskIds.map(id => ({ id, active: true }))
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("plan-generate error", error);
    return new Response(JSON.stringify({ error: error?.message || "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
