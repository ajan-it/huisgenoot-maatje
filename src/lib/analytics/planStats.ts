// Analytics helper for plan statistics and fairness calculations
import type { Task, Person, Plan, Occurrence } from "@/types/models";
import type { FairnessDetails } from "@/types/plan";

export type Assignment = {
  id: string;
  task_id: string;
  task_name: string;
  task_category: string;
  task_duration: number;
  task_difficulty: 1 | 2 | 3;
  date: string;
  assigned_person_id: string;
  status: 'scheduled' | 'done' | 'moved' | 'backlog';
  rationale?: { reasons: string[] };
};

export type PersonStats = {
  pts: number;
  min: number;
  hard: number;
  med: number;
  light: number;
  disliked: number;
  evenings: number[]; // Mon-Fri evening points
  cats: Record<string, number>;
};

export type SwapSuggestion = {
  taskA: string;
  personA: string;
  taskB: string;
  personB: string;
  fairnessGain: number;
  description: string;
};

const WEIGHT = { 1: 1.0, 2: 1.3, 3: 1.6 };

export const isWeeknight = (d: Date) => [1, 2, 3, 4, 5].includes(d.getDay());
export const isEvening = (timeSlot: string) => {
  // For now, assume all tasks can be evening tasks
  // In reality, you'd parse time_slot.start >= "18:00"
  return true; 
};

export function points(a: Assignment, coopMult = 1): number {
  return Math.round(a.task_duration * WEIGHT[a.task_difficulty] * coopMult);
}

export function splitByPerson(
  assignments: Assignment[], 
  coopMap: Record<string, 'lead' | 'assist' | 'solo'> = {}
): Map<string, PersonStats> {
  const by = new Map<string, PersonStats>();

  for (const asg of assignments.filter(x => x.status === 'scheduled')) {
    const id = asg.assigned_person_id;
    if (!id) continue;

    const mult = coopMap[asg.task_id] === 'assist' ? 0.5 : 1;
    const p = points(asg, mult);

    const cur = by.get(id) ?? { 
      pts: 0, min: 0, hard: 0, med: 0, light: 0, 
      disliked: 0, evenings: [0, 0, 0, 0, 0], cats: {} 
    };

    cur.pts += p;
    cur.min += asg.task_duration;

    // Classify by difficulty points
    if (p > 35) cur.hard += p;
    else if (p >= 15) cur.med += p;
    else cur.light += p;

    // Check if disliked (simplistic flag check)
    if (asg.rationale?.reasons?.includes('disliked')) {
      cur.disliked += p;
    }

    // Evening distribution (Mon=0...Fri=4)
    const d = new Date(asg.date);
    if (isWeeknight(d)) {
      const dayIndex = d.getDay() - 1; // Convert to 0-4
      if (dayIndex >= 0 && dayIndex < 5) {
        cur.evenings[dayIndex] += p;
      }
    }

    // Category breakdown
    cur.cats[asg.task_category] = (cur.cats[asg.task_category] ?? 0) + p;
    by.set(id, cur);
  }
  
  return by;
}

export function calculateTargetSplit(people: Person[]): Record<string, number> {
  const adults = people.filter(p => p.role === 'adult');
  const totalBudget = adults.reduce((sum, p) => sum + p.weekly_time_budget, 0);
  
  const split: Record<string, number> = {};
  adults.forEach(p => {
    split[p.id] = totalBudget > 0 ? p.weekly_time_budget / totalBudget : 0.5;
  });
  
  return split;
}

export function generateSwapSuggestions(
  assignments: Assignment[],
  people: Person[],
  currentFairness: number
): SwapSuggestion[] {
  const suggestions: SwapSuggestion[] = [];
  const stats = splitByPerson(assignments);
  const targetSplit = calculateTargetSplit(people);
  
  // Simple suggestion: find one person overloaded, another underloaded
  const personIds = Array.from(stats.keys());
  
  for (let i = 0; i < personIds.length; i++) {
    for (let j = i + 1; j < personIds.length; j++) {
      const personA = personIds[i];
      const personB = personIds[j];
      
      const statsA = stats.get(personA)!;
      const statsB = stats.get(personB)!;
      
      // If A is overloaded and B is underloaded, suggest a swap
      const targetA = targetSplit[personA] || 0.5;
      const targetB = targetSplit[personB] || 0.5;
      
      const actualA = statsA.pts / (statsA.pts + statsB.pts);
      const actualB = statsB.pts / (statsA.pts + statsB.pts);
      
      if (actualA > targetA + 0.1 && actualB < targetB - 0.1) {
        // Find a task to swap
        const taskA = assignments.find(a => a.assigned_person_id === personA && a.status === 'scheduled');
        const taskB = assignments.find(a => a.assigned_person_id === personB && a.status === 'scheduled');
        
        if (taskA && taskB) {
          suggestions.push({
            taskA: taskA.task_name,
            personA: people.find(p => p.id === personA)?.first_name || personA,
            taskB: taskB.task_name,
            personB: people.find(p => p.id === personB)?.first_name || personB,
            fairnessGain: 6, // Mock improvement
            description: `Swap ${taskA.task_name} → ${people.find(p => p.id === personB)?.first_name}`
          });
        }
      }
    }
  }
  
  return suggestions.slice(0, 3); // Return top 3
}

export function transformOccurrencesToAssignments(
  occurrences: Occurrence[],
  tasks: Task[]
): Assignment[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  console.log('Transforming occurrences:', { occurrences, tasks });
  
  return occurrences.map(occ => {
    const task = taskMap.get(occ.task_id);
    return {
      id: occ.id,
      task_id: occ.task_id,
      task_name: task?.name || 'Unknown Task',
      task_category: task?.category || 'cleaning',
      task_duration: task?.default_duration || 30,
      task_difficulty: task?.difficulty || 2,
      date: occ.date,
      assigned_person_id: occ.assigned_person || '',
      status: occ.status,
      rationale: occ.rationale ? { reasons: [] } : undefined
    };
  });
}