import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TestConfig {
  timing: 'T-24h' | 'T-2h' | 'overdue' | 'custom';
  customDate?: Date;
  markCritical: boolean;
  resetReminderLevel: boolean;
}

export interface OccurrenceData {
  id: string;
  date: string;
  task_name: string;
  assigned_person: string;
  status: string;
  is_critical: boolean;
  due_at: string | null;
  reminder_level: number;
  last_reminded_at: string | null;
  start_time: string;
  plan_id: string;
}

export interface HouseholdData {
  id: string;
  settings: any;
  reminder_settings: any;
}

export interface OriginalValues {
  due_at: string | null;
  is_critical: boolean;
  reminder_level: number;
  last_reminded_at: string | null;
}

const DEFAULT_TEST_CONFIG: TestConfig = {
  timing: 'T-24h',
  markCritical: false,
  resetReminderLevel: false,
};

export function useReminderTester() {
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdData | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceData | null>(null);
  const [testConfig, setTestConfig] = useState<TestConfig>(DEFAULT_TEST_CONFIG);
  const [originalValues, setOriginalValues] = useState<OriginalValues | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is owner/admin
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setIsOwner(false);
        setLoading(false);
        return;
      }

      const { data: memberships, error } = await supabase
        .from('household_members')
        .select('role')
        .eq('user_id', user.user.id);

      if (error) throw error;

      // Check if user has owner role in any household
      const hasOwnerRole = memberships?.some(m => m.role === 'owner');
      setIsOwner(hasOwnerRole || false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  };

  const applyTestConfig = async () => {
    if (!selectedOccurrence) return;

    try {
      // Store original values for reverting
      setOriginalValues({
        due_at: selectedOccurrence.due_at,
        is_critical: selectedOccurrence.is_critical,
        reminder_level: selectedOccurrence.reminder_level,
        last_reminded_at: selectedOccurrence.last_reminded_at,
      });

      // Calculate new due_at based on timing
      let newDueAt: string | null = null;
      const now = new Date();
      
      switch (testConfig.timing) {
        case 'T-24h':
          newDueAt = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();
          break;
        case 'T-2h':
          newDueAt = new Date(now.getTime() + 110 * 60 * 1000).toISOString();
          break;
        case 'overdue':
          newDueAt = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
          break;
        case 'custom':
          newDueAt = testConfig.customDate?.toISOString() || null;
          break;
      }

      const updates: any = { due_at: newDueAt };
      
      if (testConfig.markCritical) {
        updates.is_critical = true;
      }
      
      if (testConfig.resetReminderLevel) {
        updates.reminder_level = 0;
        updates.last_reminded_at = null;
      }

      const { error } = await supabase
        .from('occurrences')
        .update(updates)
        .eq('id', selectedOccurrence.id);

      if (error) throw error;

      // Update local state
      setSelectedOccurrence({
        ...selectedOccurrence,
        ...updates,
      });

      toast({
        title: "Test Configuration Applied",
        description: "Occurrence has been updated with test values",
      });
    } catch (error) {
      console.error('Error applying test config:', error);
      toast({
        title: "Error",
        description: "Failed to apply test configuration",
        variant: "destructive",
      });
    }
  };

  const revertChanges = async () => {
    if (!selectedOccurrence || !originalValues) return;

    try {
      const { error } = await supabase
        .from('occurrences')
        .update(originalValues)
        .eq('id', selectedOccurrence.id);

      if (error) throw error;

      // Update local state
      setSelectedOccurrence({
        ...selectedOccurrence,
        ...originalValues,
      });

      setOriginalValues(null);

      toast({
        title: "Changes Reverted",
        description: "Occurrence has been restored to original values",
      });
    } catch (error) {
      console.error('Error reverting changes:', error);
      toast({
        title: "Error",
        description: "Failed to revert changes",
        variant: "destructive",
      });
    }
  };

  const canRevert = originalValues !== null;

  return {
    selectedHousehold,
    setSelectedHousehold,
    selectedOccurrence,
    setSelectedOccurrence,
    testConfig,
    setTestConfig,
    originalValues,
    applyTestConfig,
    revertChanges,
    canRevert,
    isOwner,
    loading,
  };
}