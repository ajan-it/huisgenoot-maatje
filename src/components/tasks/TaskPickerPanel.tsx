import { useState, useMemo } from 'react';
import { Search, Filter, Check, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScopeMenu, ScopeOptions } from './ScopeMenu';
import { BulkActionBar } from './BulkActionBar';
import { ConfirmPill } from './ConfirmPill';
import { FairnessHint } from './FairnessHint';

interface TaskPickerPanelProps {
  householdId: string;
  dateRange: { start: Date; end: Date };
  onClose?: () => void;
}

interface TaskAction {
  taskId: string;
  action: 'include' | 'exclude' | 'frequency_change';
  scope: ScopeOptions;
}

export function TaskPickerPanel({ householdId, dateRange, onClose }: TaskPickerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [confirmPill, setConfirmPill] = useState<{ 
    message: string; 
    undo: () => void;
    shiftedPoints?: number;
  } | null>(null);
  const [pendingActions, setPendingActions] = useState<TaskAction[]>([]);

  // Fetch available tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`household_id.eq.${householdId},is_template.eq.true`)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof tasks> = {};
    filteredTasks.forEach(task => {
      if (!groups[task.category]) {
        groups[task.category] = [];
      }
      groups[task.category].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSingleTaskAction = async (taskId: string, action: 'include' | 'exclude', options: ScopeOptions) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newAction: TaskAction = {
      taskId,
      action,
      scope: options,
    };

    await applyTaskAction(newAction);
    
    const actionText = action === 'include' ? 'Added' : 'Removed';
    const scopeText = getScopeText(options.scope);
    
    const taskPoints = (task.default_duration || 30) * (task.difficulty || 1);
    const shiftedPoints = action === 'exclude' ? -taskPoints : taskPoints;
    
    setConfirmPill({
      message: `${actionText} ${task.name} ${scopeText}`,
      undo: () => undoAction(newAction),
      shiftedPoints,
    });
  };

  const handleBulkAction = async (action: 'include' | 'exclude' | 'frequency_change', options: ScopeOptions) => {
    const actions: TaskAction[] = Array.from(selectedTasks).map(taskId => ({
      taskId,
      action,
      scope: options,
    }));

    await Promise.all(actions.map(applyTaskAction));
    
    const actionText = action === 'include' ? 'Added' : action === 'exclude' ? 'Removed' : 'Changed frequency for';
    const scopeText = getScopeText(options.scope);
    
    // Calculate total shifted points for bulk actions
    const totalShiftedPoints = actions.reduce((sum, taskAction) => {
      const task = filteredTasks.find(t => t.id === taskAction.taskId);
      const taskPoints = task ? (task.default_duration || 30) * (task.difficulty || 1) : 0;
      return sum + (taskAction.action === 'exclude' ? -taskPoints : taskPoints);
    }, 0);
    
    setConfirmPill({
      message: `${actionText} ${selectedTasks.size} tasks ${scopeText}`,
      undo: () => Promise.all(actions.map(undoAction)),
      shiftedPoints: totalShiftedPoints,
    });
    
    setSelectedTasks(new Set());
  };

  const applyTaskAction = async (action: TaskAction) => {
    // Calculate effective dates based on scope
    const effectiveFrom = getEffectiveDate(action.scope.scope, dateRange.start);
    const effectiveTo = action.scope.snoozeUntil || (action.scope.scope === 'once' ? effectiveFrom : null);

    const { error } = await supabase
      .from('task_overrides')
      .insert({
        household_id: householdId,
        task_id: action.taskId,
        scope: action.scope.scope,
        effective_from: effectiveFrom.toISOString().split('T')[0],
        effective_to: effectiveTo?.toISOString().split('T')[0],
        action: action.action,
      });

    if (error) {
      console.error('Error applying task action:', error);
      throw error;
    }

    setPendingActions(prev => [...prev, action]);
  };

  const undoAction = async (action: TaskAction) => {
    const effectiveFrom = getEffectiveDate(action.scope.scope, dateRange.start);
    
    const { error } = await supabase
      .from('task_overrides')
      .delete()
      .eq('household_id', householdId)
      .eq('task_id', action.taskId)
      .eq('scope', action.scope.scope)
      .eq('effective_from', effectiveFrom.toISOString().split('T')[0])
      .eq('action', action.action);

    if (error) {
      console.error('Error undoing task action:', error);
      throw error;
    }

    setPendingActions(prev => prev.filter(a => a !== action));
    setConfirmPill(null);
  };

  const getEffectiveDate = (scope: string, baseDate: Date): Date => {
    const date = new Date(baseDate);
    
    switch (scope) {
      case 'week':
        // Start of week (Monday)
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
      
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1);
      
      case 'always':
        return new Date(2000, 0, 1); // Far past date for always
      
      default:
        return date;
    }
  };

  const getScopeText = (scope: string): string => {
    switch (scope) {
      case 'once': return 'this time only';
      case 'week': return 'this week';
      case 'month': return 'this month';
      case 'always': return 'always';
      case 'snooze': return 'until specified date';
      default: return '';
    }
  };

  const frequencyColors: Record<string, string> = {
    daily: 'bg-red-100 text-red-800',
    weekly: 'bg-blue-100 text-blue-800',
    monthly: 'bg-green-100 text-green-800',
    quarterly: 'bg-yellow-100 text-yellow-800',
    seasonal: 'bg-purple-100 text-purple-800',
    annual: 'bg-gray-100 text-gray-800',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Tasks</SheetTitle>
            </SheetHeader>
            {/* Add filter options here */}
          </SheetContent>
        </Sheet>
      </div>

      {/* Task Groups */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <div key={category}>
            <h3 className="font-medium text-sm text-muted-foreground mb-2 capitalize">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryTasks.map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={(checked) => 
                          handleTaskSelect(task.id, checked as boolean)
                        }
                      />
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={frequencyColors[task.frequency] || 'bg-gray-100'}>
                            {task.frequency}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {task.default_duration}min
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <ScopeMenu
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                      onSelect={(options) => 
                        handleSingleTaskAction(task.id, 'exclude', options)
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTasks.size}
        onInclude={(options) => handleBulkAction('include', options)}
        onExclude={(options) => handleBulkAction('exclude', options)}
        onChangeFrequency={(options) => handleBulkAction('frequency_change', options)}
        onClearSelection={() => setSelectedTasks(new Set())}
      />

      {/* Fairness Hint */}
      {confirmPill?.shiftedPoints && (
        <FairnessHint
          shiftedPoints={confirmPill.shiftedPoints}
          onRebalance={() => {
            // TODO: Implement rebalance functionality
            console.log('Rebalance requested');
          }}
          className="mb-4"
        />
      )}

      {/* Confirm Pill */}
      {confirmPill && (
        <ConfirmPill
          message={confirmPill.message}
          onUndo={confirmPill.undo}
          onDismiss={() => setConfirmPill(null)}
        />
      )}
    </div>
  );
}