import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface GenerateRequest {
  household_id: string
  date_range: {
    start: string
    end: string
  }
  context: 'week' | 'month' | 'year'
  selected_tasks?: string[]
}

interface DiffSummary {
  added: number
  removed: number
  shifted_points_by_person: Record<string, number>
}

interface TaskOverride {
  id: string
  household_id: string
  task_id: string
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze'
  effective_from: string
  effective_to?: string
  action: 'include' | 'exclude' | 'frequency_change'
  frequency?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response("ok", { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { household_id, date_range, context, selected_tasks } = await req.json() as GenerateRequest

    console.log('Generating plan with overrides:', { household_id, date_range, context })

    // Get household people
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .eq('household_id', household_id)

    if (peopleError) throw peopleError

    // Get task overrides for the date range
    const { data: overrides, error: overridesError } = await supabase
      .from('task_overrides')
      .select('*')
      .eq('household_id', household_id)
      .lte('effective_from', date_range.end)
      .or(`effective_to.is.null,effective_to.gte.${date_range.start}`)

    if (overridesError) throw overridesError

    console.log('Found overrides:', overrides)

    // Get available tasks (templates + household tasks)
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .or(`household_id.eq.${household_id},is_template.eq.true`)

    if (tasksError) throw tasksError

    // Filter tasks based on overrides and selections
    const effectiveTasks = filterTasksWithOverrides(
      allTasks,
      overrides as TaskOverride[],
      selected_tasks,
      date_range
    )

    console.log('Effective tasks after overrides:', effectiveTasks.length)

    // Generate occurrences for the filtered tasks
    const occurrences = generateOccurrencesWithOverrides(
      effectiveTasks,
      overrides as TaskOverride[],
      people,
      date_range,
      context
    )

    console.log('Generated occurrences:', occurrences.length)

    // Calculate fairness impact and diff summary
    const fairnessImpact = calculateFairnessImpact(occurrences, people)
    const diffSummary = calculateDiffSummary(effectiveTasks, allTasks, overrides as TaskOverride[], people)

    return new Response(
      JSON.stringify({
        success: true,
        occurrences_count: occurrences.length,
        fairness_impact: fairnessImpact,
        overrides_applied: overrides.length,
        diff_summary: diffSummary,
        data: {
          occurrences,
          fairness_impact: fairnessImpact,
          diff_summary: diffSummary
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Plan generation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

function filterTasksWithOverrides(
  allTasks: any[], 
  overrides: TaskOverride[], 
  selectedTasks?: string[],
  dateRange?: { start: string; end: string }
): any[] {
  const taskMap = new Map(allTasks.map(task => [task.id, task]))
  
  // Start with selected tasks or all active tasks
  let effectiveTasks = selectedTasks 
    ? allTasks.filter(task => selectedTasks.includes(task.id))
    : allTasks.filter(task => task.active)

  // Apply overrides with precedence: once > week > month > snooze > always
  const precedence = { once: 5, week: 4, month: 3, snooze: 2, always: 1 }
  
  overrides
    .sort((a, b) => precedence[b.scope] - precedence[a.scope])
    .forEach(override => {
      const task = taskMap.get(override.task_id)
      if (!task) return

      switch (override.action) {
        case 'include':
          // Add task if not already included
          if (!effectiveTasks.find(t => t.id === override.task_id)) {
            effectiveTasks.push(task)
          }
          break
          
        case 'exclude':
          // Remove task
          effectiveTasks = effectiveTasks.filter(t => t.id !== override.task_id)
          break
          
        case 'frequency_change':
          // Modify task frequency
          const taskIndex = effectiveTasks.findIndex(t => t.id === override.task_id)
          if (taskIndex >= 0 && override.frequency) {
            effectiveTasks[taskIndex] = {
              ...effectiveTasks[taskIndex],
              frequency: override.frequency
            }
          }
          break
      }
    })

  return effectiveTasks
}

function generateOccurrencesWithOverrides(
  tasks: any[],
  overrides: TaskOverride[],
  people: any[],
  dateRange: { start: string; end: string },
  context: string
): any[] {
  const occurrences: any[] = []
  
  tasks.forEach(task => {
    // Get task-specific overrides
    const taskOverrides = overrides.filter(o => o.task_id === task.id)
    
    // Generate base occurrences for the task
    const taskOccurrences = generateTaskOccurrences(task, dateRange, people, context)
    
    // Apply overrides to filter out excluded dates
    const filteredOccurrences = taskOccurrences.filter(occurrence => {
      const occurrenceDate = occurrence.date
      
      // Check if this specific occurrence should be excluded
      const excludeOverride = taskOverrides.find(o => 
        o.action === 'exclude' && 
        isDateInOverrideScope(occurrenceDate, o)
      )
      
      return !excludeOverride
    })
    
    occurrences.push(...filteredOccurrences)
  })
  
  return occurrences
}

function generateTaskOccurrences(
  task: any, 
  dateRange: { start: string; end: string }, 
  people: any[],
  context: string
): any[] {
  const occurrences: any[] = []
  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  
  // Basic occurrence generation based on frequency
  // This is a simplified version - in practice you'd implement full scheduling logic
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (shouldGenerateOccurrence(task, currentDate, context)) {
      const assignedPerson = selectPerson(people, task)
      
      occurrences.push({
        task_id: task.id,
        date: currentDate.toISOString().split('T')[0],
        assigned_person: assignedPerson?.id,
        duration_min: task.default_duration,
        difficulty_weight: task.difficulty || 1,
        start_time: '18:30:00', // Default evening time
        status: 'scheduled'
      })
    }
    
    // Advance date based on frequency
    currentDate = getNextOccurrenceDate(currentDate, task.frequency)
  }
  
  return occurrences
}

function shouldGenerateOccurrence(task: any, date: Date, context: string): boolean {
  // Implement task frequency logic
  const dayOfWeek = date.getDay()
  
  switch (task.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return dayOfWeek === 1 // Monday
    case 'monthly':
      return date.getDate() === 1
    default:
      return false
  }
}

function getNextOccurrenceDate(currentDate: Date, frequency: string): Date {
  const nextDate = new Date(currentDate)
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    default:
      nextDate.setDate(nextDate.getDate() + 1)
  }
  
  return nextDate
}

function isDateInOverrideScope(date: string, override: TaskOverride): boolean {
  const checkDate = new Date(date)
  const fromDate = new Date(override.effective_from)
  const toDate = override.effective_to ? new Date(override.effective_to) : null
  
  if (toDate) {
    return checkDate >= fromDate && checkDate <= toDate
  } else {
    return checkDate >= fromDate
  }
}

function selectPerson(people: any[], task: any): any {
  // Simple random selection - in practice this would consider workload balancing
  const availablePeople = people.filter(person => 
    !person.no_go_tasks?.includes(task.id) &&
    !person.disliked_tasks?.includes(task.category)
  )
  
  if (availablePeople.length === 0) return people[0]
  
  return availablePeople[Math.floor(Math.random() * availablePeople.length)]
}

function calculateFairnessImpact(occurrences: any[], people: any[]): any {
  const impact: Record<string, number> = {}
  
  people.forEach(person => {
    const personOccurrences = occurrences.filter(o => o.assigned_person === person.id)
    const totalMinutes = personOccurrences.reduce((sum, o) => sum + o.duration_min, 0)
    impact[person.id] = totalMinutes
  })
  
  return impact
}

function calculateDiffSummary(
  effectiveTasks: any[], 
  originalTasks: any[], 
  overrides: TaskOverride[], 
  people: any[]
): DiffSummary {
  const originalActiveTasks = originalTasks.filter(task => task.active)
  
  // Count additions and removals
  const added = effectiveTasks.filter(task => 
    !originalActiveTasks.find(orig => orig.id === task.id)
  ).length
  
  const removed = originalActiveTasks.filter(orig => 
    !effectiveTasks.find(task => task.id === orig.id)
  ).length
  
  // Calculate shifted points by person based on overrides
  const shiftedPointsByPerson: Record<string, number> = {}
  people.forEach(person => {
    shiftedPointsByPerson[person.id] = 0
  })
  
  // Simple estimation: assume each override shifts points proportionally
  overrides.forEach(override => {
    const task = originalTasks.find(t => t.id === override.task_id)
    if (task) {
      const taskPoints = (task.default_duration || 30) * (task.difficulty || 1)
      const pointShift = override.action === 'exclude' ? -taskPoints : taskPoints
      
      // Distribute the shift across people (simplified)
      const personIds = people.map(p => p.id)
      if (personIds.length > 0) {
        const shiftPerPerson = pointShift / personIds.length
        personIds.forEach(personId => {
          shiftedPointsByPerson[personId] += shiftPerPerson
        })
      }
    }
  })
  
  return {
    added,
    removed,
    shifted_points_by_person: shiftedPointsByPerson
  }
}