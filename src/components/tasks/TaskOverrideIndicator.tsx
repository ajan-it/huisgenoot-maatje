import { Clock, Calendar, RotateCcw, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskOverride } from '@/hooks/useTaskOverrides';

interface TaskOverrideIndicatorProps {
  override: TaskOverride;
  taskName?: string;
}

export function TaskOverrideIndicator({ override, taskName }: TaskOverrideIndicatorProps) {
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'once': return Clock;
      case 'week': return Calendar;
      case 'month': return Calendar;
      case 'always': return RotateCcw;
      case 'snooze': return Pause;
      default: return Clock;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'once': return 'This time only';
      case 'week': return 'This week';
      case 'month': return 'This month';
      case 'always': return 'Always';
      case 'snooze': return 'Snoozed';
      default: return scope;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'include': return 'bg-green-100 text-green-800 border-green-200';
      case 'exclude': return 'bg-red-100 text-red-800 border-red-200';
      case 'frequency_change': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTooltipContent = () => {
    const actionText = override.action === 'include' ? 'Included' : 
                      override.action === 'exclude' ? 'Excluded' : 'Frequency changed';
    const scopeText = getScopeLabel(override.scope);
    
    let content = `${actionText} ${scopeText.toLowerCase()}`;
    
    if (override.effective_to) {
      content += ` until ${new Date(override.effective_to).toLocaleDateString()}`;
    }
    
    if (taskName) {
      content = `${taskName}: ${content}`;
    }
    
    return content;
  };

  const Icon = getScopeIcon(override.scope);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getActionColor(override.action)} text-xs`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {override.action === 'include' ? '+' : 
             override.action === 'exclude' ? '−' : '~'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}