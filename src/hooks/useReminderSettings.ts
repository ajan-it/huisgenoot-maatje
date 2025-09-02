import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReminderSettings {
  email_enabled: boolean;
  morning_helper_enabled: boolean;
  quiet_hours: {
    start: string;
    end: string;
  };
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  email_enabled: true,
  morning_helper_enabled: true,
  quiet_hours: {
    start: '21:30',
    end: '07:00'
  }
};

export function useReminderSettings(householdId?: string) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [actualHouseholdId, setActualHouseholdId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get household ID from database if not provided
  useEffect(() => {
    if (householdId) {
      setActualHouseholdId(householdId);
    } else {
      fetchHouseholdId();
    }
  }, [householdId]);

  useEffect(() => {
    if (actualHouseholdId) {
      fetchSettings();
    }
  }, [actualHouseholdId]);

  const fetchHouseholdId = async () => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (error) throw error;
      setActualHouseholdId(data?.household_id);
    } catch (error) {
      console.error('Error fetching household ID:', error);
      toast({
        title: "Error",
        description: "Failed to load household settings",
        variant: "destructive"
      });
    }
  };

  const fetchSettings = async () => {
    if (!actualHouseholdId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('households')
        .select('reminder_settings')
        .eq('id', actualHouseholdId)
        .single();

      if (error) throw error;
      
      setSettings((data?.reminder_settings as unknown as ReminderSettings) || DEFAULT_REMINDER_SETTINGS);
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
      setSettings(DEFAULT_REMINDER_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: ReminderSettings) => {
    if (!actualHouseholdId) return;

    try {
      const { error } = await supabase
        .from('households')
        .update({ reminder_settings: newSettings as any })
        .eq('id', actualHouseholdId);

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Success",
        description: "Reminder settings updated"
      });
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings
  };
}