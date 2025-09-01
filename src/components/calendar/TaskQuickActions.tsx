import { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskPickerPanel } from '@/components/tasks/TaskPickerPanel';
import { ScopeMenu, ScopeOptions } from '@/components/tasks/ScopeMenu';

interface TaskQuickActionsProps {
  householdId: string;
  date: Date;
  taskId?: string;
  onTaskUpdate?: () => void;
}

export function TaskQuickActions({ householdId, date, taskId, onTaskUpdate }: TaskQuickActionsProps) {
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const handleScopeSelect = async (options: ScopeOptions) => {
    // Handle task removal/modification
    console.log('Task scope action:', options);
    onTaskUpdate?.();
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
        <ScopeMenu
          trigger={
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
          onSelect={handleScopeSelect}
          currentDate={date}
        />
      )}
    </div>
  );
}