import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { BoostSettings } from "@/types/disruptions";

const DEFAULT_BOOST_SETTINGS: BoostSettings = {
  enabled: false,
  channels: ['push'],
  quiet_hours: {
    start: '21:30',
    end: '07:30'
  },
  auto_suggest: {
    admin: true,
    childcare: true,
    errands: true,
    maintenance: true,
    safety: true
  }
};

export function useBoostSettings(householdId?: string) {
  const [settings, setSettings] = useState<BoostSettings>(DEFAULT_BOOST_SETTINGS);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (householdId) {
      fetchSettings();
    }
  }, [householdId]);

  const fetchSettings = async () => {
    if (!householdId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('households')
        .select('boost_settings')
        .eq('id', householdId)
        .single();

      if (error) throw error;
      
      setSettings((data?.boost_settings as unknown as BoostSettings) || DEFAULT_BOOST_SETTINGS);
    } catch (error) {
      console.error('Error fetching boost settings:', error);
      setSettings(DEFAULT_BOOST_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: BoostSettings) => {
    if (!householdId) return;

    try {
      const { error } = await supabase
        .from('households')
        .update({ boost_settings: newSettings as any })
        .eq('id', householdId);

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Success",
        description: "Boost settings updated"
      });
    } catch (error) {
      console.error('Error updating boost settings:', error);
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