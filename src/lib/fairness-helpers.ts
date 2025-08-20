export type Assignment = {
  id: string;
  task_name: string;
  task_category: string;
  task_duration: number;
  difficulty_weight: number;
  date: string;
  assigned_person_id: string;
  status: string;
  rationale?: { reasons: string[] };
};

export type PersonSplit = {
  id: string;
  name: string;
  actualMinutes: number;
  actualPoints: number;
  targetMinutes: number;
  targetPoints: number;
  actualShare: number; // 0..1
  targetShare: number; // 0..1
  deltaMinutes: number;
  eveningsOverCap: number;
  stackingViolations: number;
  dislikedAssignments: number;
};

export type TypeBreakdown = Record<string, number>; // category -> points

export type DifficultyCount = {
  hard: number;
  medium: number;
  easy: number;
};

export type EveningLoad = {
  date: string;
  minutes: number;
};

export type FairnessTrendPoint = {
  weekStart: string;
  fairness: number;
};

// Check if task is mandatory based on category and name patterns
export function isMandatory(assignment: Assignment): boolean {
  const mandatoryCategories = ['childcare', 'kitchen'];
  if (!mandatoryCategories.includes(assignment.task_category)) return false;
  
  const timefixedPatterns = [
    'brengen', 'ophalen', 'ontbijt', 'diner', 'bedtijd', 'baddertijd', 
    'pickup', 'dropoff', 'breakfast', 'dinner', 'bedtime', 'bathtime'
  ];
  
  const taskNameLower = assignment.task_name.toLowerCase();
  return timefixedPatterns.some(pattern => taskNameLower.includes(pattern));
}

// Calculate points for an assignment
export function points(assignment: Assignment): number {
  return assignment.task_duration * assignment.difficulty_weight;
}

// Categorize difficulty based on points
export function bucket(pointsValue: number): 'easy' | 'medium' | 'hard' {
  if (pointsValue < 20) return 'easy';
  if (pointsValue < 40) return 'medium';
  return 'hard';
}

// Map task category to standardized keys
export function categoryKey(taskCategory: string): string {
  const categoryMap: Record<string, string> = {
    kitchen: 'kitchen',
    bathroom: 'cleaning', 
    cleaning: 'cleaning',
    admin: 'admin',
    childcare: 'childcare',
    errands: 'errands',
    maintenance: 'maintenance',
    selfcare: 'other',
    social: 'other',
    garden: 'other',
    appliance: 'maintenance',
    safety: 'other',
    outdoor: 'other',
    seasonal: 'other',
  };
  
  return categoryMap[taskCategory] || 'other';
}

// Build type breakdown for a person
export function buildTypeBreakdown(assignments: Assignment[], personId: string): TypeBreakdown {
  const breakdown: TypeBreakdown = {};
  
  assignments
    .filter(a => a.assigned_person_id === personId)
    .forEach(assignment => {
      const category = categoryKey(assignment.task_category);
      const taskPoints = points(assignment);
      breakdown[category] = (breakdown[category] || 0) + taskPoints;
    });
    
  return breakdown;
}

// Build evening loads for a person (Mon-Fri only)
export function buildEveningLoads(assignments: Assignment[], personId: string): EveningLoad[] {
  const eveningLoads = new Map<string, number>();
  
  assignments
    .filter(a => a.assigned_person_id === personId)
    .forEach(assignment => {
      const date = new Date(assignment.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Only include Mon-Fri (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateStr = assignment.date;
        const currentMinutes = eveningLoads.get(dateStr) || 0;
        eveningLoads.set(dateStr, currentMinutes + assignment.task_duration);
      }
    });
    
  // Convert to array and sort by date
  return Array.from(eveningLoads.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Build difficulty counts for a person
export function buildDifficultyCounts(assignments: Assignment[], personId: string): DifficultyCount {
  const counts: DifficultyCount = { hard: 0, medium: 0, easy: 0 };
  
  assignments
    .filter(a => a.assigned_person_id === personId)
    .forEach(assignment => {
      const taskPoints = points(assignment);
      const difficulty = bucket(taskPoints);
      counts[difficulty]++;
    });
    
  return counts;
}

// Get or initialize trend history from localStorage
export function getTrendHistory(): FairnessTrendPoint[] {
  try {
    const raw = localStorage.getItem('planHistory');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save trend point to localStorage (keep last 4)
export function saveTrendPoint(weekStart: string, fairness: number): void {
  try {
    const history = getTrendHistory();
    const newPoint = { weekStart, fairness };
    
    // Remove existing entry for same week
    const filtered = history.filter(p => p.weekStart !== weekStart);
    
    // Add new point and keep last 4
    const updated = [...filtered, newPoint].slice(-4);
    
    localStorage.setItem('planHistory', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save trend point:', error);
  }
}

// Count mandatory vs flexible tasks and points
export function getMandatoryFlexibleCounts(assignments: Assignment[]) {
  let mandatoryTasks = 0;
  let mandatoryPoints = 0;
  let flexibleTasks = 0;
  let flexiblePoints = 0;
  
  assignments.forEach(assignment => {
    const taskPoints = points(assignment);
    if (isMandatory(assignment)) {
      mandatoryTasks++;
      mandatoryPoints += taskPoints;
    } else {
      flexibleTasks++;
      flexiblePoints += taskPoints;
    }
  });
  
  return {
    mandatory: { tasks: mandatoryTasks, points: mandatoryPoints },
    flexible: { tasks: flexibleTasks, points: flexiblePoints }
  };
}
