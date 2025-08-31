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
  const [error, setError] = useState<string | null>(null);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const { toast } = useToast();

  // Using the first household ID from the database
  const householdId = "1b2dc522-7093-4b62-9c40-ce031c527066";

  useEffect(() => {
    // Prevent duplicate requests
    if (isRequestInProgress) {
      console.log('Request already in progress, skipping duplicate');
      return;
    }

    let isCancelled = false;
    
    const fetchDataSafe = async () => {
      if (!isCancelled && !isRequestInProgress) {
        await fetchData();
      }
    };
    
    fetchDataSafe();
    
    return () => {
      isCancelled = true;
    };
  }, [startDate, endDate, filters]);

  const fetchData = async () => {
    if (isRequestInProgress) {
      console.log('Fetch already in progress, aborting duplicate request');
      return;
    }

    console.log('Fetching calendar data for:', { startDate, endDate, filters, householdId });
    setIsRequestInProgress(true);
    setLoading(true);
    setError(null);
    
    try {
      // First check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Authentication check:', { session: !!session, sessionError });
      
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('User not authenticated. Please sign in.');
      }

      // Build query for occurrences with retry logic
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

      // Execute query with timeout
      const queryPromise = query;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      );

      const { data: occurrenceData, error: occurrenceError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      
      console.log('Query result:', { occurrenceData, occurrenceError });
      
      if (occurrenceError) {
        console.error('Supabase query error:', occurrenceError);
        throw occurrenceError;
      }
      
      setOccurrences(occurrenceData || []);

      // Fetch boosts if enabled
      if (filters.showBoosts) {
        try {
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
            // Don't fail the whole request for boost errors
          } else {
            setBoosts(boostData || []);
          }
        } catch (boostErr) {
          console.error('Boost fetch failed:', boostErr);
          setBoosts([]);
        }
      } else {
        setBoosts([]);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load calendar data';
      setError(errorMessage);
      
      // Show toast for user feedback
      toast({
        title: "Connection Error",
        description: "Unable to load calendar data. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRequestInProgress(false);
    }
  };

  return {
    occurrences,
    boosts,
    loading,
    error,
    refetch: fetchData
  };
}