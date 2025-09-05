import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CalendarFilters {
  persons: string[];
  categories: string[];
  status: string;
  showBoosts: boolean;
}

interface UseOccurrencesParams {
  householdId: string | null;
  planId: string | null;
  range: {
    start: Date;
    end: Date;
  };
  filters?: CalendarFilters;
}

export function useOccurrences({ householdId, planId, range, filters }: UseOccurrencesParams) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['occurrences', householdId, planId, format(range.start, 'yyyy-MM-dd'), format(range.end, 'yyyy-MM-dd'), filters],
    queryFn: async () => {
      if (!householdId || !planId) {
        console.log('❌ Missing required params:', { householdId, planId });
        return { occurrences: [], boosts: [] };
      }

      console.log('🔍 Fetching occurrences:', { 
        householdId, 
        planId, 
        dateRange: `${format(range.start, 'yyyy-MM-dd')} to ${format(range.end, 'yyyy-MM-dd')}`,
        filters 
      });

      try {
        // Build occurrences query with reliable LEFT JOINs
        let query = supabase
          .from('occurrences')
          .select(`
            id,
            plan_id,
            task_id,
            date,
            assigned_person,
            status,
            start_time,
            duration_min,
            is_critical,
            boost_enabled,
            frequency_source,
            difficulty_weight,
            tasks (
              id,
              name,
              category,
              default_duration
            )
          `)
          .eq('plan_id', planId)
          .gte('date', format(range.start, 'yyyy-MM-dd'))
          .lte('date', format(range.end, 'yyyy-MM-dd'));

        // Apply status filter (default to active statuses)
        if (filters?.status === 'all') {
          query = query.in('status', ['scheduled', 'done', 'moved']);
        } else if (filters?.status && filters.status !== 'active') {
          query = query.eq('status', filters.status as any);
        } else {
          query = query.in('status', ['scheduled', 'done', 'moved']);
        }

        // Apply person filter
        if (filters?.persons && filters.persons.length > 0) {
          query = query.in('assigned_person', filters.persons);
        }

        const { data: occurrences, error: occurrencesError } = await query;
        
        if (occurrencesError) {
          throw occurrencesError;
        }

        // Fetch people separately for reliability
        const { data: people, error: peopleError } = await supabase
          .from('people')
          .select('id, first_name, role')
          .eq('household_id', householdId);
          
        if (peopleError) {
          console.warn('Failed to fetch people:', peopleError);
        }

        // Create people lookup map
        const peopleMap = new Map(people?.map(p => [p.id, p]) || []);

        // Enrich occurrences with people data
        const enrichedOccurrences = (occurrences || []).map(occ => ({
          ...occ,
          people: occ.assigned_person ? peopleMap.get(occ.assigned_person) : null
        }));

        // Apply category filter after enrichment
        let filteredOccurrences = enrichedOccurrences;
        if (filters?.categories && filters.categories.length > 0) {
          filteredOccurrences = enrichedOccurrences.filter(occ => 
            filters.categories.includes(occ.tasks?.category || '')
          );
        }

        console.log('✅ Fetched occurrences:', {
          total: filteredOccurrences.length,
          firstThree: filteredOccurrences.slice(0, 3).map(o => ({ id: o.id, name: o.tasks?.name, person: o.people?.first_name }))
        });

        // Fetch boosts if enabled
        let boosts: any[] = [];
        if (filters?.showBoosts && filteredOccurrences.length > 0) {
          const occurrenceIds = filteredOccurrences.map(occ => occ.id);
          
          const { data: boostData, error: boostError } = await supabase
            .from('boosts_log')
            .select('*')
            .in('task_occurrence_id', occurrenceIds)
            .gte('sent_at', range.start.toISOString())
            .lte('sent_at', range.end.toISOString());

          if (boostError) {
            console.warn('Failed to fetch boosts:', boostError);
          } else {
            boosts = boostData || [];
          }
        }

        return {
          occurrences: filteredOccurrences,
          boosts
        };

      } catch (error) {
        console.error('❌ Error fetching occurrences:', error);
        
        toast({
          title: "Data Loading Error",
          description: "Unable to load calendar data. Please check your connection and try again.",
          variant: "destructive"
        });
        
        throw error;
      }
    },
    enabled: Boolean(householdId && planId),
  });
}

// Utility hook for cache invalidation after plan generation
export function useInvalidateOccurrences() {
  const queryClient = useQueryClient();
  
  return (householdId?: string) => {
    // Invalidate all occurrence-related queries
    queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    queryClient.invalidateQueries({ queryKey: ['plan-selection'] });
    
    if (householdId) {
      queryClient.invalidateQueries({ queryKey: ['occurrences', householdId] });
    }
    
    console.log('🔄 Invalidated occurrences cache');
  };
}