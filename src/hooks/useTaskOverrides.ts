import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskOverride {
  id: string;
  household_id: string;
  task_id: string;
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  effective_from: string;
  effective_to?: string;
  action: 'include' | 'exclude' | 'frequency_change';
  frequency?: string;
  created_by: string;
  created_at: string;
}

export interface CreateOverrideParams {
  household_id: string;
  task_id: string;
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  effective_from: string;
  effective_to?: string;
  action: 'include' | 'exclude' | 'frequency_change';
  frequency?: string;
}

export function useTaskOverrides(householdId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch overrides for household
  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['task-overrides', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      
      const { data, error } = await supabase
        .from('task_overrides')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TaskOverride[];
    },
    enabled: !!householdId,
  });

  // Create override mutation
  const createOverride = useMutation({
    mutationFn: async (params: CreateOverrideParams) => {
      const { data, error } = await supabase
        .from('task_overrides')
        .insert(params)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-overrides', householdId] });
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to apply task override",
        variant: "destructive",
      });
      console.error('Create override error:', error);
    },
  });

  // Delete override mutation
  const deleteOverride = useMutation({
    mutationFn: async (overrideId: string) => {
      const { error } = await supabase
        .from('task_overrides')
        .delete()
        .eq('id', overrideId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-overrides', householdId] });
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to remove task override",
        variant: "destructive",
      });
      console.error('Delete override error:', error);
    },
  });

  // Helper to get effective overrides for a date range
  const getEffectiveOverrides = (startDate: Date, endDate: Date): TaskOverride[] => {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    return overrides.filter(override => {
      const from = override.effective_from;
      const to = override.effective_to;
      
      // Check if override is active in the date range
      if (to) {
        // Has end date - check if range overlaps
        return from <= end && to >= start;
      } else {
        // No end date - check if start is before or during range
        return from <= end;
      }
    });
  };

  // Helper to check if task is overridden
  const isTaskOverridden = (taskId: string, date: Date, action: 'include' | 'exclude'): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Get all overrides for this task sorted by precedence
    const taskOverrides = overrides
      .filter(o => o.task_id === taskId && o.action === action)
      .filter(o => {
        const from = o.effective_from;
        const to = o.effective_to;
        
        if (to) {
          return from <= dateStr && to >= dateStr;
        } else {
          return from <= dateStr;
        }
      })
      .sort((a, b) => {
        // Sort by precedence: once > week > month > snooze > always
        const precedence = { once: 5, week: 4, month: 3, snooze: 2, always: 1 };
        return precedence[b.scope] - precedence[a.scope];
      });
    
    return taskOverrides.length > 0;
  };

  return {
    overrides,
    isLoading,
    createOverride: createOverride.mutateAsync,
    deleteOverride: deleteOverride.mutateAsync,
    getEffectiveOverrides,
    isTaskOverridden,
    isCreating: createOverride.isPending,
    isDeleting: deleteOverride.isPending,
  };
}