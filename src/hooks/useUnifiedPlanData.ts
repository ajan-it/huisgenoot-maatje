import { usePlanSelection } from "@/hooks/usePlanSelection";
import { useOccurrences } from "@/hooks/useOccurrences";
import { format } from "date-fns";
import { resolveRealContext } from "@/lib/resolve-real-context";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarFilters {
  persons: string[];
  categories: string[];
  status: string;
  showBoosts: boolean;
}

export function useUnifiedPlanData(startDate: Date, endDate: Date, filters: CalendarFilters) {
  const { session } = useAuth();
  
  // Resolve real context to prevent demo mode bleeding
  const realContext = resolveRealContext({
    session,
    route: { planId: null }, // Calendar views don't have specific plan routes
    local: { lastPlanResponse: localStorage.getItem('lastPlanResponse') }
  });

  if (import.meta.env.DEV) {
    console.log('🔍 useUnifiedPlanData context:', realContext, {
      range: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`
    });
  }

  // Use the new plan selection hook only for real users
  const planSelection = usePlanSelection({
    dateRange: { start: startDate, end: endDate },
    enabled: !realContext.isDemo
  });

  // Use the new occurrences hook
  const occurrenceQuery = useOccurrences({
    householdId: realContext.isDemo ? null : planSelection.data?.householdId || null,
    planId: realContext.isDemo ? null : planSelection.data?.selectedPlanId || null,
    range: { start: startDate, end: endDate },
    filters,
    enabled: !realContext.isDemo
  });

  // Extract data from queries
  const occurrences = occurrenceQuery.data?.occurrences || [];
  const boosts = occurrenceQuery.data?.boosts || [];
  const loading = planSelection.isLoading || occurrenceQuery.isLoading;
  const error = planSelection.error || occurrenceQuery.error;

  // Debug info for development
  const debugInfo = {
    isDemo: realContext.isDemo,
    userId: realContext.userId?.slice(0, 8) + '...',
    householdId: realContext.isDemo ? 'DEMO' : planSelection.data?.householdId,
    selectedPlanId: realContext.isDemo ? 'DEMO' : planSelection.data?.selectedPlanId,
    isFallback: realContext.isDemo ? false : (planSelection.data?.isFallback || false),
    dateRange: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
    fetchedCount: occurrences.length,
    firstThreeOccurrenceIds: occurrences.slice(0, 3).map(o => o.id),
    planCount: realContext.isDemo ? 0 : (planSelection.data?.plans?.length || 0)
  };

  return {
    occurrences,
    boosts,
    loading,
    error: error?.message || null,
    planSelection: planSelection.data,
    debugInfo,
    refetch: () => {
      planSelection.refetch();
      occurrenceQuery.refetch();
    }
  };
}