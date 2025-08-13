import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const week_start = input?.week_start || new Date().toISOString().slice(0, 10);
    const household_id = input?.household_id || "HH_LOCAL";
    const timezone = input?.timezone || "Europe/Amsterdam";

    const people = Array.isArray(input?.people) ? input.people : [];
    const tasks = Array.isArray(input?.tasks) ? input.tasks : [];

    // More lenient filtering - if no explicit active field, assume active
    const activeTasks = tasks.filter((t: any) => t && (t.active !== false && t.active !== 0));
    const adults = people.filter((p: any) => p && (p.role === "adult" || !p.role));
    
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
    const assignments = generateTaskAssignments(activeTasks, adults, week_start);
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
      tasks: activeTasks
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
