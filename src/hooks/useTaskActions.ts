import { useState } from 'react';
import { useTaskOverrides, CreateOverrideParams } from './useTaskOverrides';
import { usePlanGeneration } from './usePlanGeneration';
import { useToast } from './use-toast';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { isDemoMode } from '@/lib/demo-utils';

export interface TaskActionState {
  confirmPill: {
    message: string;
    overrideId: string;
    shiftedPoints: number;
  } | null;
}

export interface TaskActionOptions {
  taskId: string;
  taskName: string;
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  snoozeUntil?: Date;
  baseDate: Date;
}

export function useTaskActions(householdId: string) {
  const [actionState, setActionState] = useState<TaskActionState>({
    confirmPill: null,
  });
  
  const { createOverride, deleteOverride, isCreating } = useTaskOverrides(householdId);
  const { generatePlan, isGenerating } = usePlanGeneration();
  const { toast } = useToast();

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
    const { taskId, taskName, scope, snoozeUntil, baseDate } = options;
    
    // Check for demo mode
    if (isDemoMode(householdId)) {
      toast({
        title: "Demo Mode",
        description: "Task removal is not available in demo mode. Please sign in to use full features.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { from, to } = getEffectiveDates(scope, baseDate, snoozeUntil);
      
      const overrideParams: CreateOverrideParams = {
        household_id: householdId,
        task_id: taskId,
        scope,
        effective_from: from,
        effective_to: to,
        action: 'exclude',
      };

      const override = await createOverride(overrideParams);

      // Generate new plan to get diff_summary
      const planResponse = await generatePlan({
        household_id: householdId,
        date_range: {
          start: from,
          end: to || from
        },
        context: 'week'
      });

      const shiftedPointsObj = planResponse.diff_summary?.shifted_points_by_person || {};
      const shiftedPoints = Math.abs(
        Object.values(shiftedPointsObj)
          .map(points => Number(points) || 0)
          .reduce((total, points) => total + Math.abs(points), 0)
      );

      // Show confirmation pill
      setActionState({
        confirmPill: {
          message: `Removed ${taskName} ${getScopeDescription(scope)}.`,
          overrideId: override.id,
          shiftedPoints
        }
      });

      // Auto-hide after 30 seconds
      setTimeout(() => {
        setActionState({ confirmPill: null });
      }, 30000);

      return planResponse;
    } catch (error) {
      console.error('Remove task error:', error);
      toast({
        title: "Error",
        description: "Failed to remove task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const undoRemove = async () => {
    if (!actionState.confirmPill) return;
    
    try {
      await deleteOverride(actionState.confirmPill.overrideId);
      
      // Regenerate plan
      await generatePlan({
        household_id: householdId,
        date_range: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        context: 'week'
      });

      setActionState({ confirmPill: null });
      
      toast({
        title: "Undone",
        description: "Task has been restored",
      });
    } catch (error) {
      console.error('Undo error:', error);
      toast({
        title: "Error",
        description: "Failed to undo action",
        variant: "destructive",
      });
    }
  };

  const dismissConfirmPill = () => {
    setActionState({ confirmPill: null });
  };

  return {
    removeTask,
    undoRemove,
    dismissConfirmPill,
    actionState,
    isProcessing: isCreating || isGenerating,
    isDemoMode: isDemoMode(householdId),
  };
}