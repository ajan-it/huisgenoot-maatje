import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, endOfYear } from 'date-fns';

interface FairnessMetrics {
  personId: string;
  personName: string;
  totalMinutes: number;
  totalPoints: number;
  weeklyBudget: number;
  yearlyBudget: number;
  fairnessPercentage: number;
  reliabilityScore: number;
  completedTasks: number;
  totalTasks: number;
}

export function useLongTermFairness(householdId?: string, year?: number) {
  return useQuery({
    queryKey: ['long-term-fairness', householdId, year],
    queryFn: async (): Promise<FairnessMetrics[]> => {
      if (!householdId || !year) return [];

      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));

      // Get household people
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, first_name, weekly_time_budget')
        .eq('household_id', householdId);

      if (peopleError) throw peopleError;

      // Get all occurrences for the year
      const { data: occurrences, error: occurrencesError } = await supabase
        .from('occurrences')
        .select(`
          *,
          plans!inner(household_id)
        `)
        .eq('plans.household_id', householdId)
        .gte('date', yearStart.toISOString().split('T')[0])
        .lte('date', yearEnd.toISOString().split('T')[0]);

      if (occurrencesError) throw occurrencesError;

      // Calculate metrics for each person
      const metrics: FairnessMetrics[] = (people || []).map(person => {
        const personOccurrences = (occurrences || []).filter(occ => 
          occ.assigned_person === person.id
        );

        const totalMinutes = personOccurrences.reduce((sum, occ) => 
          sum + (occ.duration_min || 0), 0
        );

        const totalPoints = personOccurrences.reduce((sum, occ) => 
          sum + ((occ.duration_min || 0) * (occ.difficulty_weight || 1)), 0
        );

        const completedTasks = personOccurrences.filter(occ => 
          occ.status === 'done'
        ).length;

        const totalTasks = personOccurrences.length;
        const weeklyBudget = person.weekly_time_budget || 0;
        const yearlyBudget = weeklyBudget * 52;

        // Calculate fairness as percentage of total household work
        const totalHouseholdMinutes = (occurrences || []).reduce((sum, occ) => 
          sum + (occ.duration_min || 0), 0
        );
        const fairnessPercentage = totalHouseholdMinutes > 0 
          ? (totalMinutes / totalHouseholdMinutes) * 100 
          : 0;

        // Calculate reliability score
        const reliabilityScore = totalTasks > 0 
          ? (completedTasks / totalTasks) * 100 
          : 100;

        return {
          personId: person.id,
          personName: person.first_name,
          totalMinutes,
          totalPoints,
          weeklyBudget,
          yearlyBudget,
          fairnessPercentage,
          reliabilityScore,
          completedTasks,
          totalTasks,
        };
      });

      return metrics;
    },
    enabled: !!householdId && !!year,
  });
}