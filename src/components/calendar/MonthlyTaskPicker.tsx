import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskPickerPanel } from '@/components/tasks/TaskPickerPanel';
import { startOfMonth, endOfMonth } from 'date-fns';

interface MonthlyTaskPickerProps {
  householdId: string;
  currentDate: Date;
  onTasksUpdate?: () => void;
}

export function MonthlyTaskPicker({ householdId, currentDate, onTasksUpdate }: MonthlyTaskPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const handleClose = () => {
    setIsOpen(false);
    onTasksUpdate?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Pick Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Tasks for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </DialogTitle>
        </DialogHeader>
        <TaskPickerPanel
          householdId={householdId}
          dateRange={{ start: monthStart, end: monthEnd }}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}