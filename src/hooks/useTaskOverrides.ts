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
      console.log('Creating task override with params:', params);
      
      // Validate household ID format
      if (!params.household_id || params.household_id === 'HH_LOCAL' || !params.household_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Invalid household_id for task override:', params.household_id);
        throw new Error('Cannot create task overrides for demo/local plans. Please create a real household first.');
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user for override:', user?.id);
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      // Verify user is household member
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('household_id', params.household_id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (membershipError) {
        console.error('Error checking household membership:', membershipError);
        throw new Error('Failed to verify household membership');
      }
      
      if (!membership) {
        console.error('User is not a member of household:', params.household_id);
        throw new Error('You are not a member of this household');
      }

      const overrideData = {
        ...params,
        created_by: user.id
      };

      console.log('Inserting override data:', overrideData);
      const { data, error } = await supabase
        .from('task_overrides')
        .insert(overrideData)
        .select()
        .single();
      
      if (error) {
        console.error('Task override creation error:', error);
        console.error('Override data that failed:', overrideData);
        throw error;
      }
      
      console.log('Successfully created task override:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-overrides', householdId] });
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
    onError: (error) => {
      console.error('Create override error:', error);
      let errorMessage = "Failed to apply task override";
      
      if (error.message?.includes('demo/local plans')) {
        errorMessage = "Task removal is not available for demo plans. Please create a real household first.";
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = "Please log in to remove tasks";
      } else if (error.message?.includes('not a member')) {
        errorMessage = "You don't have permission to modify this household's tasks";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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