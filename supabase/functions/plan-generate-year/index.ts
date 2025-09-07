import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface TaskTemplate {
  id: string;
  name: string;
  category: string;
  default_duration: number;
  difficulty: number;
  frequency: string;
  seasonal_months?: number[];
  preferred_month?: number;
  tags: string[];
}

interface GenerateYearRequest {
  household_id: string;
  year: number;
  selected_tasks: string[];
  people: Array<{
    id: string;
    weekly_time_budget: number;
    disliked_tasks: string[];
    no_go_tasks: string[];
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { household_id, year, selected_tasks, people }: GenerateYearRequest = await req.json();

    console.log('Generating year-long plan for household:', household_id, 'year:', year);

    // Create or find the plan for this year
    const yearStart = `${year}-01-01`;
    const { data: existingPlan } = await supabaseClient
      .from('plans')
      .select('id')
      .eq('household_id', household_id)
      .eq('week_start', yearStart)
      .single();

    let planId: string;
    if (existingPlan) {
      planId = existingPlan.id;
      // Clear existing occurrences for regeneration
      await supabaseClient
        .from('occurrences')
        .delete()
        .eq('plan_id', planId);
    } else {
      const { data: newPlan, error: planError } = await supabaseClient
        .from('plans')
        .insert({
          household_id,
          week_start: yearStart,
          status: 'active'
        })
        .select('id')
        .single();

      if (planError || !newPlan) {
        throw new Error('Failed to create plan: ' + planError?.message);
      }
      planId = newPlan.id;
    }

    // Get task templates
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .in('id', selected_tasks);

    if (tasksError || !tasks) {
      throw new Error('Failed to fetch tasks: ' + tasksError?.message);
    }

    const occurrences: any[] = [];

    // Generate occurrences for each task
    for (const task of tasks as TaskTemplate[]) {
      const taskOccurrences = generateTaskOccurrences(task, year, people);
      occurrences.push(...taskOccurrences.map(occ => ({ ...occ, plan_id: planId, task_id: task.id })));
    }

    // Batch insert occurrences
    if (occurrences.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('occurrences')
        .insert(occurrences);

      if (insertError) {
        throw new Error('Failed to insert occurrences: ' + insertError.message);
      }
    }

    console.log(`Generated ${occurrences.length} occurrences for year ${year}`);

    return new Response(JSON.stringify({ 
      plan_id: planId, 
      occurrences_count: occurrences.length,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating year plan:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateTaskOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  const availablePeople = people.filter(p => 
    !p.no_go_tasks.includes(task.name) && 
    !p.no_go_tasks.includes(task.category)
  );

  if (availablePeople.length === 0) {
    console.warn(`No available people for task: ${task.name}`);
    return [];
  }

  switch (task.frequency) {
    case 'daily':
      return generateDailyOccurrences(task, year, availablePeople);
    case 'weekly':
      return generateWeeklyOccurrences(task, year, availablePeople);
    case 'monthly':
      return generateMonthlyOccurrences(task, year, availablePeople);
    case 'seasonal':
      return generateSeasonalOccurrences(task, year, availablePeople);
    case 'quarterly':
      return generateQuarterlyOccurrences(task, year, availablePeople);
    case 'semiannual':
      return generateSemiAnnualOccurrences(task, year, availablePeople);
    case 'annual':
      return generateAnnualOccurrences(task, year, availablePeople);
    default:
      console.warn(`Unknown frequency: ${task.frequency}`);
      return [];
  }
}

function generateDailyOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const assignedPerson = selectPerson(people, task);
    
    occurrences.push({
      date: date.toISOString().split('T')[0],
      assigned_person: assignedPerson.id,
      start_time: '18:30:00',
      duration_min: task.default_duration,
      difficulty_weight: task.difficulty,
      frequency_source: 'daily',
      status: 'scheduled'
    });
  }
  
  return occurrences;
}

function generateWeeklyOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  const startDate = new Date(year, 0, 1);
  
  // Find first Monday of the year
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() + 1);
  }
  
  for (let week = 0; week < 52; week++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + (week * 7));
    
    if (weekDate.getFullYear() === year) {
      const assignedPerson = selectPerson(people, task);
      
      occurrences.push({
        date: weekDate.toISOString().split('T')[0],
        assigned_person: assignedPerson.id,
        start_time: '19:00:00',
        duration_min: task.default_duration,
        difficulty_weight: task.difficulty,
        frequency_source: 'weekly',
        status: 'scheduled'
      });
    }
  }
  
  return occurrences;
}

function generateMonthlyOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 15); // Middle of month
    const assignedPerson = selectPerson(people, task);
    
    occurrences.push({
      date: date.toISOString().split('T')[0],
      assigned_person: assignedPerson.id,
      start_time: '10:00:00',
      duration_min: task.default_duration,
      difficulty_weight: task.difficulty,
      frequency_source: 'monthly',
      status: 'scheduled'
    });
  }
  
  return occurrences;
}

function generateSeasonalOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  
  if (!task.seasonal_months || task.seasonal_months.length === 0) {
    return occurrences;
  }
  
  // Place in the middle of the seasonal months range
  const middleMonth = task.seasonal_months[Math.floor(task.seasonal_months.length / 2)];
  const date = new Date(year, middleMonth - 1, 15);
  const assignedPerson = selectPerson(people, task);
  
  occurrences.push({
    date: date.toISOString().split('T')[0],
    assigned_person: assignedPerson.id,
    start_time: '10:00:00',
    duration_min: task.default_duration,
    difficulty_weight: task.difficulty,
    frequency_source: 'seasonal',
    status: 'scheduled'
  });
  
  return occurrences;
}

function generateQuarterlyOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  const quarters = [2, 5, 8, 11]; // Feb, May, Aug, Nov
  
  for (const month of quarters) {
    const date = new Date(year, month, 15);
    const assignedPerson = selectPerson(people, task);
    
    occurrences.push({
      date: date.toISOString().split('T')[0],
      assigned_person: assignedPerson.id,
      start_time: '14:00:00',
      duration_min: task.default_duration,
      difficulty_weight: task.difficulty,
      frequency_source: 'quarterly',
      status: 'scheduled'
    });
  }
  
  return occurrences;
}

function generateSemiAnnualOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const occurrences: any[] = [];
  const months = [2, 8]; // March, September
  
  for (const month of months) {
    const date = new Date(year, month, 15);
    const assignedPerson = selectPerson(people, task);
    
    occurrences.push({
      date: date.toISOString().split('T')[0],
      assigned_person: assignedPerson.id,
      start_time: '11:00:00',
      duration_min: task.default_duration,
      difficulty_weight: task.difficulty,
      frequency_source: 'semiannual',
      status: 'scheduled'
    });
  }
  
  return occurrences;
}

function generateAnnualOccurrences(task: TaskTemplate, year: number, people: any[]): any[] {
  const assignedPerson = selectPerson(people, task);
  
  // Place annual tasks in preferred month or default to March
  const month = task.preferred_month ? task.preferred_month - 1 : 2;
  const date = new Date(year, month, 15);
  
  return [{
    date: date.toISOString().split('T')[0],
    assigned_person: assignedPerson.id,
    start_time: '10:00:00',
    duration_min: task.default_duration,
    difficulty_weight: task.difficulty,
    frequency_source: 'annual',
    status: 'scheduled'
  }];
}

function selectPerson(people: any[], task: TaskTemplate): any {
  // Simple round-robin assignment for now
  // In the future, this should consider:
  // - Person's time budget
  // - Task preferences/dislikes
  // - Fairness distribution
  // - Workload balancing
  
  const availablePeople = people.filter(p => 
    !p.disliked_tasks.includes(task.name) && 
    !p.disliked_tasks.includes(task.category)
  );
  
  if (availablePeople.length === 0) {
    return people[0]; // Fallback to first person
  }
  
  // For now, just rotate through available people
  const randomIndex = Math.floor(Math.random() * availablePeople.length);
  return availablePeople[randomIndex];
}