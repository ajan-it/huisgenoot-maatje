import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskPickerPanel } from '@/components/tasks/TaskPickerPanel';
import { startOfYear, endOfYear } from 'date-fns';

interface YearlyTaskPickerProps {
  householdId: string;
  year: number;
  onTasksUpdate?: () => void;
}

export function YearlyTaskPicker({ householdId, year, onTasksUpdate }: YearlyTaskPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

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
            Manage Tasks for {year}
          </DialogTitle>
        </DialogHeader>
        <TaskPickerPanel
          householdId={householdId}
          dateRange={{ start: yearStart, end: yearEnd }}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}