import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface CalendarFilters {
  persons: string[];
  categories: string[];
  status: string;
  showBoosts: boolean;
}

interface PlanSelection {
  householdId: string | null;
  selectedPlanId: string | null;
  plans: any[];
}

export function useUnifiedPlanData(startDate: Date, endDate: Date, filters: CalendarFilters) {
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current household and plan selection
  const { data: planSelection } = useQuery<PlanSelection>({
    queryKey: ['plan-selection'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { householdId: null, selectedPlanId: null, plans: [] };
      
      // Get household
      const { data: household, error: householdError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (householdError || !household) {
        return { householdId: null, selectedPlanId: null, plans: [] };
      }

      // Get all plans for this household
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('household_id', household.household_id)
        .order('week_start', { ascending: false });

      if (plansError) {
        console.error('Error fetching plans:', plansError);
        return { householdId: household.household_id, selectedPlanId: null, plans: [] };
      }

      // Select the most appropriate plan based on date range
      let selectedPlan = null;
      if (plans && plans.length > 0) {
        // Try to find a plan that covers our date range
        selectedPlan = plans.find(plan => {
          const planStart = new Date(plan.week_start);
          const planEnd = new Date(planStart);
          planEnd.setDate(planEnd.getDate() + 365); // Assume yearly plans
          return startDate >= planStart && startDate <= planEnd;
        });
        
        // If no specific plan found, use the most recent one
        if (!selectedPlan) {
          selectedPlan = plans[0];
        }
      }

      return {
        householdId: household.household_id,
        selectedPlanId: selectedPlan?.id || null,
        plans: plans || []
      };
    },
  });

  // Fetch occurrences data
  useEffect(() => {
    if (!planSelection?.householdId || !planSelection?.selectedPlanId) {
      setOccurrences([]);
      setBoosts([]);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching unified plan data:', { 
          householdId: planSelection.householdId,
          selectedPlanId: planSelection.selectedPlanId,
          startDate, 
          endDate, 
          filters 
        });

        // Build query for occurrences
        let query = supabase
          .from('occurrences')
          .select(`
            *,
            tasks (id, name, category, default_duration),
            people!occurrences_assigned_person_fkey (id, first_name, role),
            plans!inner (household_id)
          `)
          .eq('plan_id', planSelection.selectedPlanId)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        // Apply filters
        if (filters.persons.length > 0) {
          query = query.in('assigned_person', filters.persons);
        }
        
        if (filters.categories.length > 0) {
          query = query.in('tasks.category', filters.categories as any);
        }
        
        if (filters.status !== 'all') {
          // Only show scheduled, done, moved by default (exclude backlog)
          if (filters.status === 'active') {
            query = query.in('status', ['scheduled', 'done', 'moved']);
          } else {
            query = query.eq('status', filters.status as any);
          }
        } else {
          // Default: show active statuses
          query = query.in('status', ['scheduled', 'done', 'moved']);
        }

        const { data: occurrenceData, error: occurrenceError } = await query;
        
        if (occurrenceError) {
          throw occurrenceError;
        }
        
        if (!isCancelled) {
          setOccurrences(occurrenceData || []);
        }

        // Fetch boosts if enabled
        if (filters.showBoosts && !isCancelled) {
          const { data: boostData, error: boostError } = await supabase
            .from('boosts_log')
            .select(`
              *,
              occurrences!inner (
                date,
                plan_id
              )
            `)
            .eq('occurrences.plan_id', planSelection.selectedPlanId)
            .gte('sent_at', startDate.toISOString())
            .lte('sent_at', endDate.toISOString());

          if (boostError) {
            console.error('Error fetching boosts:', boostError);
          } else {
            setBoosts(boostData || []);
          }
        } else {
          setBoosts([]);
        }

      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching unified plan data:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load plan data';
          setError(errorMessage);
          
          toast({
            title: "Data Loading Error",
            description: "Unable to load plan data. Please check your connection and try again.",
            variant: "destructive"
          });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isCancelled = true;
    };
  }, [planSelection?.householdId, planSelection?.selectedPlanId, startDate, endDate, filters, toast]);

  // Debug info for development
  const debugInfo = {
    householdId: planSelection?.householdId,
    selectedPlanId: planSelection?.selectedPlanId,
    dateRange: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
    fetchedCount: occurrences.length,
    firstThreeOccurrenceIds: occurrences.slice(0, 3).map(o => o.id)
  };

  return {
    occurrences,
    boosts,
    loading,
    error,
    planSelection,
    debugInfo,
    refetch: () => {
      // Trigger a refetch by updating the query key
      window.location.reload(); // Simple approach for now
    }
  };
}