import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { DayDrawer } from "@/components/calendar/DayDrawer";
import { useCalendarData } from "@/hooks/useCalendarData";
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay,
  addYears,
  subYears
} from "date-fns";
import { nl, enUS } from "date-fns/locale";

const CalendarYear = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // URL state
  const currentYear = useMemo(() => {
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    return new Date(year, 0, 1);
  }, [searchParams]);

  const filters = useMemo(() => ({
    persons: searchParams.get('persons')?.split(',') || [],
    categories: searchParams.get('categories')?.split(',') || [],
    status: searchParams.get('status') || 'all',
    showBoosts: searchParams.get('boosts') === 'true'
  }), [searchParams]);

  // Data
  const { occurrences, boosts, loading } = useCalendarData(
    startOfYear(currentYear),
    endOfYear(currentYear),
    filters
  );

  // Navigation
  const navigateYear = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' 
      ? subYears(currentYear, 1) 
      : addYears(currentYear, 1);
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('year', newYear.getFullYear().toString());
      return newParams;
    });
  };

  // Group data by date
  const dataByDate = useMemo(() => {
    const grouped: Record<string, { occurrences: any[], boosts: any[], points: number }> = {};
    
    // Process occurrences
    occurrences.forEach(occ => {
      const dateKey = format(new Date(occ.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = { occurrences: [], boosts: [], points: 0 };
      }
      grouped[dateKey].occurrences.push(occ);
      grouped[dateKey].points += (occ.duration_min || 0) * (occ.difficulty_weight || 1);
    });

    // Process boosts
    if (boosts) {
      boosts.forEach(boost => {
        const dateKey = format(new Date(boost.sent_at), 'yyyy-MM-dd');
        if (grouped[dateKey]) {
          grouped[dateKey].boosts.push(boost);
        }
      });
    }

    return grouped;
  }, [occurrences, boosts]);

  // Get intensity level for points
  const getIntensityLevel = (points: number) => {
    if (points === 0) return 'none';
    if (points <= 30) return 'low';
    if (points <= 60) return 'medium';
    return 'high';
  };

  // Get intensity class
  const getIntensityClass = (level: string) => {
    const classes = {
      none: 'bg-muted/20',
      low: 'bg-blue-100',
      medium: 'bg-blue-300',
      high: 'bg-blue-500'
    };
    return classes[level as keyof typeof classes] || classes.none;
  };

  const locale = lang === 'nl' ? nl : enUS;

  // Generate months
  const months = eachMonthOfInterval({
    start: startOfYear(currentYear),
    end: endOfYear(currentYear)
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateYear('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-2xl font-semibold">
            {format(currentYear, 'yyyy')}
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateYear('next')}
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

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{t('intensity')}:</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-muted/20 rounded"></div>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Med</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>High</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span>🔔 {t('boost_sent')}</span>
            <span>⛑️ {t('backup_used')}</span>
            <span>☆ {t('complete')}</span>
          </div>
        </div>
      </Card>

      {/* Year Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          
          // Add padding for first week
          const firstDay = getDay(monthStart);
          const paddingStart = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, () => null);

          return (
            <Card key={format(month, 'yyyy-MM')} className="p-4">
              {/* Month header */}
              <h3 className="text-lg font-medium mb-3 text-center">
                {format(month, 'MMMM', { locale })}
              </h3>

              {/* Week headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month days */}
              <div className="grid grid-cols-7 gap-1">
                {paddingStart.map((_, i) => (
                  <div key={`padding-${i}`} className="h-8" />
                ))}
                
                {days.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayData = dataByDate[dateKey];
                  const intensity = getIntensityLevel(dayData?.points || 0);
                  const hasBoosts = dayData?.boosts?.length > 0;
                  const allCompleted = dayData?.occurrences?.length > 0 && 
                    dayData.occurrences.every(occ => occ.status === 'completed');

                  return (
                    <div
                      key={dateKey}
                      className={`h-8 rounded cursor-pointer hover:ring-2 hover:ring-ring relative flex items-center justify-center text-xs font-medium transition-all ${getIntensityClass(intensity)}`}
                      onClick={() => setSelectedDate(day)}
                      title={`${format(day, 'MMM d')}: ${dayData?.points || 0} points`}
                    >
                      {format(day, 'd')}
                      
                      {/* Badges */}
                      <div className="absolute -top-1 -right-1 flex space-x-0.5">
                        {hasBoosts && <span className="text-xs">🔔</span>}
                        {allCompleted && <span className="text-xs">☆</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Day Drawer */}
      <DayDrawer
        date={selectedDate}
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        occurrences={selectedDate ? dataByDate[format(selectedDate, 'yyyy-MM-dd')]?.occurrences || [] : []}
      />
    </div>
  );
};

export default CalendarYear;