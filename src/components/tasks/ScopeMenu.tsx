import { useState } from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

export type ScopeType = 'once' | 'week' | 'month' | 'always' | 'snooze';

export interface ScopeOptions {
  scope: ScopeType;
  snoozeUntil?: Date;
}

interface ScopeMenuProps {
  trigger: React.ReactNode;
  onSelect: (options: ScopeOptions) => void;
  currentDate?: Date;
  disabled?: boolean;
}

export function ScopeMenu({ trigger, onSelect, currentDate = new Date(), disabled = false }: ScopeMenuProps) {
  const [snoozeDate, setSnoozeDate] = useState<Date>();
  const [showSnoozeCalendar, setShowSnoozeCalendar] = useState(false);

  const handleSnoozeSelect = (date: Date | undefined) => {
    if (date) {
      setSnoozeDate(date);
      onSelect({ scope: 'snooze', snoozeUntil: date });
      setShowSnoozeCalendar(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          How long should this change apply?
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onSelect({ scope: 'once' })}>
          <Clock className="mr-2 h-4 w-4" />
          Only this time
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onSelect({ scope: 'week' })}>
          <Calendar className="mr-2 h-4 w-4" />
          This week
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onSelect({ scope: 'month' })}>
          <Calendar className="mr-2 h-4 w-4" />
          This month
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onSelect({ scope: 'always' })}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Always
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <Popover open={showSnoozeCalendar} onOpenChange={setShowSnoozeCalendar}>
          <PopoverTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Clock className="mr-2 h-4 w-4" />
              Snooze until...
            </DropdownMenuItem>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={snoozeDate}
              onSelect={handleSnoozeSelect}
              disabled={(date) => date <= currentDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}