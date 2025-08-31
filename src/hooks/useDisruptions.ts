import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Disruption } from "@/types/disruptions";

export function useDisruptions(householdId?: string, weekStart?: string) {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (householdId) {
      fetchDisruptions();
    }
  }, [householdId, weekStart]);

  const fetchDisruptions = async () => {
    if (!householdId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('disruptions')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (weekStart) {
        query = query.eq('week_start', weekStart);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDisruptions(data || []);
    } catch (error) {
      console.error('Error fetching disruptions:', error);
      toast({
        title: "Error",
        description: "Failed to load disruptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDisruptions = async (newDisruptions: Partial<Disruption>[]) => {
    if (!householdId) return;

    try {
      const user = await supabase.auth.getUser();
      const disruptions = newDisruptions.map(disruption => ({
        household_id: householdId,
        created_by: user.data.user?.id!,
        type: disruption.type!,
        week_start: disruption.week_start!,
        affected_person_ids: disruption.affected_person_ids || [],
        nights_impacted: disruption.nights_impacted || 0,
        notes: disruption.notes,
        consent_a: disruption.consent_a || false,
        consent_b: disruption.consent_b || false
      }));

      const { error } = await supabase
        .from('disruptions')
        .insert(disruptions);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Disruptions logged successfully"
      });

      fetchDisruptions();
      return true;
    } catch (error) {
      console.error('Error creating disruptions:', error);
      toast({
        title: "Error",
        description: "Failed to log disruptions",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    disruptions,
    loading,
    createDisruptions,
    refetch: fetchDisruptions
  };
}