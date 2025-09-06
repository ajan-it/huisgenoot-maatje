import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PlanSelection {
  householdId: string | null;
  selectedPlanId: string | null;
  plans: any[];
  isFallback: boolean;
}

interface UsePlanSelectionParams {
  dateRange: {
    start: Date;
    end: Date;
  };
  enabled?: boolean;
}

export function usePlanSelection({ dateRange, enabled = true }: UsePlanSelectionParams) {
  return useQuery<PlanSelection>({
    queryKey: ['plan-selection', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    enabled,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Authentication check:', { 
        hasSession: !!session, 
        hasUser: !!session?.user, 
        userId: session?.user?.id 
      });
      
      if (!session?.user) {
        console.log('❌ No authenticated user');
        return { householdId: null, selectedPlanId: null, plans: [], isFallback: false };
      }
      
      // Get user's household memberships - handle multiple households
      const { data: memberships, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id);
      
      if (membershipError) {
        console.log('❌ Error fetching household memberships:', membershipError);
        return { householdId: null, selectedPlanId: null, plans: [], isFallback: false };
      }

      if (!memberships || memberships.length === 0) {
        console.log('❌ User has no household memberships');
        return { householdId: null, selectedPlanId: null, plans: [], isFallback: false };
      }

      console.log('🏠 User belongs to households:', memberships.map(m => m.household_id));

      // For now, use the first household - later we can add household selection logic
      const householdId = memberships[0].household_id;
      console.log('🎯 Selected household for plan lookup:', householdId);

      // Get all plans for this household
      const { data: allPlans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('household_id', householdId)
        .order('week_start', { ascending: false });

      if (plansError) {
        console.error('❌ Error fetching plans:', plansError);
        return { householdId, selectedPlanId: null, plans: [], isFallback: false };
      }

      if (!allPlans || allPlans.length === 0) {
        console.log('❌ No plans found for household');
        return { householdId, selectedPlanId: null, plans: allPlans || [], isFallback: false };
      }

      console.log(`📋 Found ${allPlans.length} plans for household`);

      // NEW ALGORITHM: Find plan that has occurrences in the requested date range
      const startDateStr = format(dateRange.start, 'yyyy-MM-dd');
      const endDateStr = format(dateRange.end, 'yyyy-MM-dd');

      console.log('🔍 Looking for plan with occurrences between:', startDateStr, 'and', endDateStr);

      // Check each plan for occurrences in the date range
      let selectedPlan = null;
      let isFallback = false;

      for (const plan of allPlans) {
        const { data: occurrences, error: occError } = await supabase
          .from('occurrences')
          .select('id')
          .eq('plan_id', plan.id)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .limit(1);

        if (!occError && occurrences && occurrences.length > 0) {
          selectedPlan = plan;
          console.log('✅ Found plan with occurrences:', plan.id, 'week_start:', plan.week_start);
          break;
        }
      }

      // Fallback to most recent plan if no occurrences found in range
      if (!selectedPlan) {
        selectedPlan = allPlans[0];
        isFallback = true;
        console.log('⚠️ No plan with occurrences in range, falling back to most recent:', selectedPlan.id);
      }

      return {
        householdId,
        selectedPlanId: selectedPlan.id,
        plans: allPlans,
        isFallback
      };
    },
  });
}