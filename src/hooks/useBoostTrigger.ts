import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useBoostTrigger() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerBoost = async (occurrenceId?: string, checkAll = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('boost-trigger', {
        body: { occurrenceId, checkAll }
      });

      if (error) throw error;

      toast({
        title: "Boost Triggered",
        description: `Processed ${data.processed} occurrences`,
      });

      return data;
    } catch (error) {
      console.error('Error triggering boost:', error);
      toast({
        title: "Error",
        description: "Failed to trigger boost",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const respondToBoost = async (
    occurrenceId: string,
    interactionType: string,
    options: {
      personId?: string;
      newDate?: string;
      newTime?: string;
      newAssignedPerson?: string;
      notes?: string;
    } = {}
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('boost-response', {
        body: {
          occurrenceId,
          interactionType,
          ...options
        }
      });

      if (error) throw error;

      toast({
        title: "Response Recorded",
        description: data.message,
      });

      return data;
    } catch (error) {
      console.error('Error responding to boost:', error);
      toast({
        title: "Error",
        description: "Failed to record response",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    triggerBoost,
    respondToBoost,
    loading
  };
}