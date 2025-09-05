import { useState } from 'react';
import { Plus, MoreHorizontal, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskPickerPanel } from '@/components/tasks/TaskPickerPanel';
import { ScopeMenu, ScopeOptions } from '@/components/tasks/ScopeMenu';
import { useTaskActions } from '@/hooks/useTaskActions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskQuickActionsProps {
  householdId: string;
  date: Date;
  taskId?: string;
  onTaskUpdate?: () => void;
}

export function TaskQuickActions({ householdId, date, taskId, onTaskUpdate }: TaskQuickActionsProps) {
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const { removeTask, isDemoMode } = useTaskActions(householdId);

  const handleScopeSelect = async (options: ScopeOptions) => {
    if (taskId) {
      await removeTask({
        taskId,
        taskName: 'Task',
        scope: options.scope,
        snoozeUntil: options.snoozeUntil,
        baseDate: date
      });
      onTaskUpdate?.();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Add Task Button */}
      <Dialog open={showTaskPicker} onOpenChange={setShowTaskPicker}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Tasks for {date.toLocaleDateString()}</DialogTitle>
          </DialogHeader>
          <TaskPickerPanel
            householdId={householdId}
            dateRange={{ start: date, end: date }}
            onClose={() => setShowTaskPicker(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Task Options (if taskId provided) */}
      {taskId && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ScopeMenu
                  trigger={
                    <Button variant="ghost" size="sm" disabled={isDemoMode}>
                      {isDemoMode ? <Lock className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                  }
                  onSelect={handleScopeSelect}
                  currentDate={date}
                  disabled={isDemoMode}
                />
              </div>
            </TooltipTrigger>
            {isDemoMode && (
              <TooltipContent>
                <p>Sign in to remove tasks</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}