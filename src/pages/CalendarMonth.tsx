import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Calendar as CalendarIcon,
  Filter,
  Settings
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { DayDrawer } from "@/components/calendar/DayDrawer";
import { MonthlyTaskPicker } from "@/components/calendar/MonthlyTaskPicker";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUnifiedPlanData } from "@/hooks/useUnifiedPlanData";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { nl, enUS } from "date-fns/locale";

const CalendarMonth = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // URL state
  const currentDate = useMemo(() => {
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    return new Date(year, month - 1, 1);
  }, [searchParams]);

  const filters = useMemo(() => ({
    persons: searchParams.get('persons')?.split(',') || [],
    categories: searchParams.get('categories')?.split(',') || [],
    status: searchParams.get('status') || 'all',
    showBoosts: searchParams.get('boosts') === 'true'
  }), [searchParams]);

  // Get current household - handle multiple households  
  const { data: householdId } = useQuery({
    queryKey: ['current-household'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data: memberships, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Use first household if multiple exist
      return memberships?.[0]?.household_id || null;
    },
  });

  // Data - using unified plan data
  const { occurrences, loading, planSelection, debugInfo } = useUnifiedPlanData(
    startOfMonth(currentDate),
    endOfMonth(currentDate),
    filters
  );

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subMonths(currentDate, 1) 
      : addMonths(currentDate, 1);
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('year', newDate.getFullYear().toString());
      newParams.set('month', (newDate.getMonth() + 1).toString());
      return newParams;
    });
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days for the first week
    const firstDay = getDay(start);
    const paddingStart = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => null);
    
    return [...paddingStart, ...days];
  }, [currentDate]);

  // Group occurrences by date
  const occurrencesByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    occurrences.forEach(occ => {
      const dateKey = format(new Date(occ.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(occ);
    });
    return grouped;
  }, [occurrences]);

  // Category colors using design system
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cleaning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      childcare: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      admin: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
      errands: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      safety: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const locale = lang === 'nl' ? nl : enUS;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Dev Banner */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            📊 Month View Debug - Household: {debugInfo.householdId?.slice(0, 8)}... | 
            Plan: {debugInfo.selectedPlanId?.slice(0, 8)}... | 
            Range: {debugInfo.dateRange} | 
            Count: {debugInfo.fetchedCount} occurrences |
            Plans: {debugInfo.planCount}
            {debugInfo.isFallback && (
              <span className="ml-2 text-red-600 dark:text-red-400">⚠️ Fallback Plan</span>
            )}
          </div>
          <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Query: {loading ? 'Loading...' : 'Complete'} |
            First 3 IDs: {debugInfo.firstThreeOccurrenceIds?.join(', ') || 'none'}
          </div>
          {!planSelection?.householdId && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              ⚠️ No household found - user may need to authenticate or join a household
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-2xl font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale })}
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick navigation to data-rich period */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('year', '2025');
                newParams.set('month', '9'); // September 2025 where seeded data exists
                return newParams;
              });
            }}
            className="text-blue-600 dark:text-blue-400"
          >
            📅 Go to Sept 2025
          </Button>
          
          {planSelection?.householdId && (
            <MonthlyTaskPicker
              householdId={planSelection.householdId}
              currentDate={currentDate}
              onTasksUpdate={() => {
                // Tasks will automatically refresh via React Query cache invalidation
                console.log('✅ Tasks updated, cache should refresh automatically');
              }}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('filters')}
          </Button>
          {/* Debug info and fallback warning in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-2">
              {debugInfo.isFallback && (
                <Badge variant="destructive" className="text-xs">
                  Fallback Plan (no occurrences in range)
                </Badge>
              )}
              <details className="text-xs bg-muted p-2 rounded">
                <summary>Debug Info</summary>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { debugOccurrences } = await import('@/utils/debugOccurrences');
                    await debugOccurrences();
                  }}
                  className="text-xs"
                >
                  🔍 Debug Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { seedTestHousehold, runCalendarTests } = await import('@/utils/testSeeds');
                    try {
                      const result = await seedTestHousehold();
                      if (result) {
                        console.log('✅ Seeded test data, running tests...');
                        await runCalendarTests(result.householdId);
                        // Force complete refresh of all queries
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('❌ Seed failed:', error);
                    }
                  }}
                  className="text-xs"
                >
                  🧪 Seed Test Data & Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <CalendarFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                if (newFilters.persons.length > 0) {
                  newParams.set('persons', newFilters.persons.join(','));
                } else {
                  newParams.delete('persons');
                }
                if (newFilters.categories.length > 0) {
                  newParams.set('categories', newFilters.categories.join(','));
                } else {
                  newParams.delete('categories');
                }
                newParams.set('status', newFilters.status);
                if (newFilters.showBoosts) {
                  newParams.set('boosts', 'true');
                } else {
                  newParams.delete('boosts');
                }
                return newParams;
              });
            }}
          />
        </Card>
      )}

      {/* Calendar Grid */}
      <Card className="p-6">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {t(day.toLowerCase())}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-24" />;
            }

            const dateKey = format(day, 'yyyy-MM-dd');
            const dayOccurrences = occurrencesByDate[dateKey] || [];
            const criticalCount = dayOccurrences.filter(occ => occ.is_critical).length;
            const totalTasks = dayOccurrences.length;
            const completedTasks = dayOccurrences.filter(occ => occ.status === 'completed').length;

            return (
              <div
                key={dateKey}
                className="h-24 border rounded-lg p-2 cursor-pointer hover:bg-accent/50 transition-colors relative"
                onClick={() => setSelectedDate(day)}
              >
                {/* Date number */}
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>

                {/* Task chips (max 3) */}
                <div className="space-y-1">
                  {dayOccurrences.slice(0, 3).map((occ, i) => (
                    <div
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-full truncate relative ${getCategoryColor(occ.tasks?.category || 'other')}`}
                      title={`${occ.tasks?.name || 'Unknown Task'} - ${occ.people?.first_name || 'Unassigned'}`}
                    >
                      {occ.tasks?.name || 'Unknown Task'}
                      {occ.is_critical && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                  ))}
                  
                  {/* Overflow indicator */}
                  {totalTasks > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{totalTasks - 3} more
                    </div>
                  )}
                </div>

                {/* Completion indicator */}
                {totalTasks > 0 && (
                  <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                    ✓ {completedTasks}/{totalTasks}
                  </div>
                )}

                {/* Critical indicator */}
                {criticalCount > 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Drawer */}
      <DayDrawer
        date={selectedDate}
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        occurrences={selectedDate ? occurrencesByDate[format(selectedDate, 'yyyy-MM-dd')] || [] : []}
      />
    </div>
  );
};

export default CalendarMonth;