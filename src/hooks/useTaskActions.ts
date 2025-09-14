import { useState } from 'react';
import { useToast } from './use-toast';
import { resolveRealContext } from '@/lib/resolve-real-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface TaskActionState {
  confirmPill: {
    message: string;
    overrideId: string;
    shiftedPoints: number;
  } | null;
}

export interface TaskActionOptions {
  occurrenceId: string;
  taskId: string;
  taskName: string;
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  snoozeUntil?: Date;
  baseDate: Date;
  planId?: string; // Add plan ID for direct RPC calls
}

export function useTaskActions(householdId: string) {
  const [actionState, setActionState] = useState<TaskActionState>({
    confirmPill: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const realContext = resolveRealContext({
    session,
    route: { planId: null },
    local: { lastPlanResponse: localStorage.getItem('lastPlanResponse') }
  });

  const getEffectiveDates = (scope: 'once' | 'week' | 'month' | 'always' | 'snooze', baseDate: Date, snoozeUntil?: Date) => {
    const baseDateStr = baseDate.toISOString().split('T')[0];
    
    switch (scope) {
      case 'once':
        return { from: baseDateStr, to: baseDateStr };
      case 'week':
        return { 
          from: startOfWeek(baseDate, { weekStartsOn: 1 }).toISOString().split('T')[0],
          to: endOfWeek(baseDate, { weekStartsOn: 1 }).toISOString().split('T')[0]
        };
      case 'month':
        return {
          from: startOfMonth(baseDate).toISOString().split('T')[0],
          to: endOfMonth(baseDate).toISOString().split('T')[0]
        };
      case 'always':
        return { from: '2000-01-01', to: undefined };
      case 'snooze':
        return { 
          from: baseDateStr, 
          to: snoozeUntil?.toISOString().split('T')[0] 
        };
      default:
        return { from: baseDateStr, to: baseDateStr };
    }
  };

  const getScopeDescription = (scope: 'once' | 'week' | 'month' | 'always' | 'snooze', lang: 'en' | 'nl' = 'en') => {
    const descriptions = {
      en: {
        once: 'today',
        week: 'this week',
        month: 'this month',
        always: 'always',
        snooze: 'until later'
      },
      nl: {
        once: 'vandaag',
        week: 'deze week', 
        month: 'deze maand',
        always: 'altijd',
        snooze: 'tot later'
      }
    };
    return descriptions[lang][scope];
  };

  const removeTask = async (options: TaskActionOptions) => {
    const { occurrenceId, taskId, taskName, scope, snoozeUntil, baseDate, planId } = options;
    
    // Check for demo mode
    if (realContext.isDemo) {
      toast({
        title: "Demo Mode",
        description: "Sign in and open a real plan to change tasks.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate request ID for tracking
    const rid = crypto.randomUUID();
    console.log('[plan/remove] click', {
      rid,
      planId,
      taskId,
      occurrenceId,
      scope,
      taskName
    });
    
    setIsProcessing(true);
    
    try {
      // Determine mode based on scope
      const mode = scope === 'always' ? 'future' : 'week';
      
      // Call the new transactional RPC function
      const { data, error } = await supabase.rpc('rpc_remove_task_transactional', {
        p_plan_id: planId,
        p_task_id: taskId,
        p_mode: mode
      });

      if (error) throw error;

      console.log('[plan/remove] ok', { rid, data });
      
      // Type the response data
      const responseData = data as any;
      
      // Show success toast
      toast({
        title: "Task removed",
        description: responseData?.summary || `Removed ${taskName} ${getScopeDescription(scope)}.`
      });

      // Show confirmation pill
      setActionState({
        confirmPill: {
          message: responseData?.summary || `Removed ${taskName} ${getScopeDescription(scope)}.`,
          overrideId: rid, // Use request ID as temporary override ID
          shiftedPoints: (responseData?.deleted_occurrences || 0) * 10 // Rough estimate
        }
      });

      // Auto-hide after 30 seconds
      setTimeout(() => {
        setActionState({ confirmPill: null });
      }, 30000);

      // B. Invalidate plan-scoped cache keys
      queryClient.invalidateQueries({ queryKey: ['occurrences', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });

      return data;
    } catch (error: any) {
      const msg = error?.message ?? 'remove failed';
      console.error('[plan/remove] FAILED', { rid, msg, error });
      
      let errorMessage = "Failed to remove task";
      if (error.message?.includes('Not authenticated')) {
        errorMessage = "Please log in to remove tasks";
      } else if (error.message?.includes('not a household member')) {
        errorMessage = "You don't have permission to modify this household's tasks";
      } else if (error.message?.includes('Unknown plan')) {
        errorMessage = "Plan not found";
      }
      
      toast({
        title: "Error",
        description: `${errorMessage} (${rid})`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const undoRemove = async () => {
    // For now, undo is not supported with direct task removal
    // TODO: Implement undo functionality by restoring occurrences
    setActionState({ confirmPill: null });
    
    toast({
      title: "Undo not available",
      description: "Please refresh the page to see the current state",
    });
  };

  const dismissConfirmPill = () => {
    setActionState({ confirmPill: null });
  };

  return {
    removeTask,
    undoRemove,
    dismissConfirmPill,
    actionState,
    isProcessing,
    isDemoMode: realContext.isDemo,
  };
}