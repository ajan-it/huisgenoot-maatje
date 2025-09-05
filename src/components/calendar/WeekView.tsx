import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { DayDrawer } from "@/components/calendar/DayDrawer";
import { TaskQuickActions } from "@/components/calendar/TaskQuickActions";
import { useUnifiedPlanData } from "@/hooks/useUnifiedPlanData";
import { PersonNameDisplay } from "@/components/calendar/PersonNameDisplay";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isSameDay
} from "date-fns";
import { nl, enUS } from "date-fns/locale";

const WeekView = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // URL state - get week start from URL or default to current week
  const currentWeek = useMemo(() => {
    const weekStr = searchParams.get('week');
    if (weekStr) {
      return startOfWeek(new Date(weekStr), { weekStartsOn: 1 });
    }
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }, [searchParams]);

  const filters = useMemo(() => ({
    persons: searchParams.get('persons')?.split(',') || [],
    categories: searchParams.get('categories')?.split(',') || [],
    status: searchParams.get('status') || 'all',
    showBoosts: searchParams.get('boosts') === 'true'
  }), [searchParams]);

  // Data - using unified plan data
  const { occurrences, loading, planSelection, debugInfo } = useUnifiedPlanData(
    startOfWeek(currentWeek, { weekStartsOn: 1 }),
    endOfWeek(currentWeek, { weekStartsOn: 1 }),
    filters
  );

  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subWeeks(currentWeek, 1) 
      : addWeeks(currentWeek, 1);
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('week', format(newWeek, 'yyyy-MM-dd'));
      return newParams;
    });
  };

  // Generate week days
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ 
      start: startOfWeek(currentWeek, { weekStartsOn: 1 }), 
      end: endOfWeek(currentWeek, { weekStartsOn: 1 }) 
    });
  }, [currentWeek]);

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

  // Get category color using design system
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-2xl font-semibold">
            {format(currentWeek, "'Week of' MMMM d, yyyy", { locale })}
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {planSelection?.householdId && (
            <TaskQuickActions
              householdId={planSelection.householdId}
              date={currentWeek}
              onTaskUpdate={() => window.location.reload()}
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
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-2 rounded">
              <summary>Debug Info</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
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

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayOccurrences = occurrencesByDate[dateKey] || [];
          const isToday = isSameDay(day, new Date());
          const totalTasks = dayOccurrences.length;
          const completedTasks = dayOccurrences.filter(occ => occ.status === 'done').length;

          return (
            <Card 
              key={dateKey} 
              className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${isToday ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              {/* Day header */}
              <div className="text-center mb-3">
                <div className="text-sm font-medium text-muted-foreground uppercase">
                  {format(day, 'EEE', { locale })}
                </div>
                <div className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(day, 'MMM', { locale })}
                </div>
              </div>

              {/* Tasks list */}
              <div className="space-y-2">
                {dayOccurrences.slice(0, 4).map((occ, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded border-l-2 border-l-primary/20 bg-card hover:bg-accent/30 transition-colors`}
                  >
                    <div className="font-medium truncate mb-1">
                      {occ.tasks?.name || 'Unknown Task'}
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <PersonNameDisplay 
                        person={occ.people} 
                        fallback="Unassigned"
                        className="text-xs truncate"
                      />
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 ${getCategoryColor(occ.tasks?.category || 'other')}`}
                        >
                          {occ.tasks?.category || 'other'}
                        </Badge>
                        {occ.is_critical && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Overflow indicator */}
                {totalTasks > 4 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{totalTasks - 4} more tasks
                  </div>
                )}
                
                {/* No tasks message */}
                {totalTasks === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4 italic">
                    {t('no_tasks')}
                  </div>
                )}
              </div>

              {/* Summary */}
              {totalTasks > 0 && (
                <div className="mt-3 pt-2 border-t text-xs text-muted-foreground text-center">
                  ✓ {completedTasks}/{totalTasks} {t('completed')}
                </div>
              )}
            </Card>
          );
        })}
      </div>

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

export default WeekView;