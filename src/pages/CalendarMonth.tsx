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
import { useCalendarData } from "@/hooks/useCalendarData";
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

  // Data
  const { occurrences, loading } = useCalendarData(
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('filters')}
          </Button>
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