import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, User, Clock, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { ScopeMenu, ScopeOptions } from "@/components/tasks/ScopeMenu";
import { ConfirmPill } from "@/components/tasks/ConfirmPill";
import { FairnessHint } from "@/components/tasks/FairnessHint";
import { useTaskActions } from "@/hooks/useTaskActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Assignment {
  id: string;
  task_id: string;
  task_name: string;
  task_duration: number;
  task_category: string;
  date: string;
  assigned_person_id: string;
  assigned_person_name: string;
  status: 'scheduled' | 'done' | 'moved' | 'backlog';
}

interface PlanScheduleProps {
  assignments: Assignment[];
  people: any[];
  weekStart: string;
}

const categoryColors: Record<string, string> = {
  kitchen: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cleaning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  childcare: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  errands: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  bathroom: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  selfcare: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  social: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  garden: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export default function PlanSchedule({ assignments, people, weekStart }: PlanScheduleProps) {
  const { lang } = useI18n();
  const L = lang === "en";

  // Get current household
  const { data: householdId } = useQuery({
    queryKey: ['current-household'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return "00000000-0000-4000-8000-000000000000"; // Demo fallback
      
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (error || !data) return "00000000-0000-4000-8000-000000000000"; // Demo fallback
      return data.household_id;
    },
  });

  const { removeTask, undoRemove, dismissConfirmPill, actionState, isProcessing } = useTaskActions(householdId || "");

  const handleRemoveTask = async (assignment: Assignment, options: ScopeOptions) => {
    if (!householdId) return;
    
    await removeTask({
      occurrenceId: assignment.id || assignment.task_id, // Use assignment id as occurrence ID
      taskId: assignment.task_id,
      taskName: assignment.task_name,
      scope: options.scope,
      snoozeUntil: options.snoozeUntil,
      baseDate: new Date(assignment.date)
    });
  };

  // Group assignments by date
  const assignmentsByDate = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.date]) {
      acc[assignment.date] = [];
    }
    acc[assignment.date].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  // Generate 7 days starting from week start
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const toggleTaskStatus = (assignmentId: string) => {
    // In a real app, this would update the task status in the database
    console.log('Toggle task status:', assignmentId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString(L ? 'en-US' : 'nl-NL', { weekday: 'short' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString(L ? 'en-US' : 'nl-NL', { month: 'short' });
    return { dayName, dayNum, month };
  };

  const getTotalTimeForDay = (dateAssignments: Assignment[]) => {
    return dateAssignments.reduce((total, assignment) => total + assignment.task_duration, 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {weekDates.map(date => {
          const dateAssignments = assignmentsByDate[date] || [];
          const { dayName, dayNum, month } = formatDate(date);
          const totalTime = getTotalTimeForDay(dateAssignments);

          return (
            <Card key={date} className="relative">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{dayNum}</div>
                      <div className="text-xs text-muted-foreground uppercase">{dayName}</div>
                      <div className="text-xs text-muted-foreground">{month}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {Math.round(totalTime / 60 * 10) / 10}h ({totalTime}min)
                    </div>
                  </div>
                  <Badge variant="outline">
                    {dateAssignments.length} {L ? 'tasks' : 'taken'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dateAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {L ? "No tasks scheduled" : "Geen taken ingepland"}
                  </p>
                ) : (
                  dateAssignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => toggleTaskStatus(assignment.id)}
                      >
                        {assignment.status === 'done' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${assignment.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            {assignment.task_name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${categoryColors[assignment.task_category] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {assignment.task_category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {assignment.assigned_person_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {assignment.task_duration}min
                          </div>
                        </div>
                      </div>
                      
                      {/* Task Actions Menu */}
                      <ScopeMenu
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isProcessing}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                        onSelect={(options) => handleRemoveTask(assignment, options)}
                        currentDate={new Date(assignment.date)}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fairness Hint */}
      {actionState.confirmPill && actionState.confirmPill.shiftedPoints >= 30 && (
        <FairnessHint
          shiftedPoints={actionState.confirmPill.shiftedPoints}
          className="mb-4"
        />
      )}

      {/* Confirm Pill */}
      {actionState.confirmPill && (
        <ConfirmPill
          message={actionState.confirmPill.message}
          onUndo={undoRemove}
          onDismiss={dismissConfirmPill}
        />
      )}
    </div>
  );
}