import { usePlanSelection } from "@/hooks/usePlanSelection";
import { useOccurrences } from "@/hooks/useOccurrences";
import { format } from "date-fns";

interface CalendarFilters {
  persons: string[];
  categories: string[];
  status: string;
  showBoosts: boolean;
}

export function useUnifiedPlanData(startDate: Date, endDate: Date, filters: CalendarFilters) {
  // Use the new plan selection hook
  const planSelection = usePlanSelection({
    dateRange: { start: startDate, end: endDate }
  });

  // Use the new occurrences hook
  const occurrenceQuery = useOccurrences({
    householdId: planSelection.data?.householdId || null,
    planId: planSelection.data?.selectedPlanId || null,
    range: { start: startDate, end: endDate },
    filters
  });

  // Extract data from queries
  const occurrences = occurrenceQuery.data?.occurrences || [];
  const boosts = occurrenceQuery.data?.boosts || [];
  const loading = planSelection.isLoading || occurrenceQuery.isLoading;
  const error = planSelection.error || occurrenceQuery.error;

  // Debug info for development
  const debugInfo = {
    householdId: planSelection.data?.householdId,
    selectedPlanId: planSelection.data?.selectedPlanId,
    isFallback: planSelection.data?.isFallback || false,
    dateRange: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
    fetchedCount: occurrences.length,
    firstThreeOccurrenceIds: occurrences.slice(0, 3).map(o => o.id),
    planCount: planSelection.data?.plans?.length || 0
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