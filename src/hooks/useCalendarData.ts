import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CalendarFilters {
  persons: string[];
  categories: string[];
  status: string;
  showBoosts: boolean;
}

export function useCalendarData(startDate: Date, endDate: Date, filters: CalendarFilters) {
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Using the same household ID as used in other parts of the app
  const householdId = "550e8400-e29b-41d4-a716-446655440000";

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, filters]);

  const fetchData = async () => {
    console.log('Fetching calendar data for:', { startDate, endDate, filters, householdId });
    setLoading(true);
    try {
      // Build query for occurrences
      let query = supabase
        .from('occurrences')
        .select(`
          *,
          tasks (id, name, category, default_duration),
          people!occurrences_assigned_person_fkey (id, first_name),
          plans!inner (household_id)
        `)
        .eq('plans.household_id', householdId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      // Apply filters
      if (filters.persons.length > 0) {
        query = query.in('assigned_person', filters.persons);
      }
      
      if (filters.categories.length > 0) {
        // Cast to avoid TypeScript strict enum checking for now
        query = query.in('tasks.category', filters.categories as any);
      }
      
      if (filters.status !== 'all') {
        // Cast to avoid TypeScript strict enum checking for now
        query = query.eq('status', filters.status as any);
      }

      const { data: occurrenceData, error: occurrenceError } = await query;
      
      console.log('Query result:', { occurrenceData, occurrenceError });
      
      if (occurrenceError) throw occurrenceError;
      
      setOccurrences(occurrenceData || []);

      // Fetch boosts if enabled
      if (filters.showBoosts) {
        const { data: boostData, error: boostError } = await supabase
          .from('boosts_log')
          .select(`
            *,
            occurrences!inner (
              date,
              plans!inner (household_id)
            )
          `)
          .eq('occurrences.plans.household_id', householdId)
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
      console.error('Error fetching calendar data:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    occurrences,
    boosts,
    loading,
    refetch: fetchData
  };
}