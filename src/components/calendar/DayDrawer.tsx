import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpDown, 
  MoveRight,
  Zap,
  MoreHorizontal
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { TaskQuickActions } from "@/components/calendar/TaskQuickActions";
import { PersonNameDisplay } from "./PersonNameDisplay";
import { ScopeMenu, ScopeOptions } from "@/components/tasks/ScopeMenu";
import { ConfirmPill } from "@/components/tasks/ConfirmPill";
import { FairnessHint } from "@/components/tasks/FairnessHint";
import { useTaskActions } from "@/hooks/useTaskActions";
import { format } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DayDrawerProps {
  date: Date | null;
  open: boolean;
  onClose: () => void;
  occurrences: any[];
}

export function DayDrawer({ date, open, onClose, occurrences }: DayDrawerProps) {
  const { t, lang } = useI18n();
  const locale = lang === 'nl' ? nl : enUS;

  // Get current household
  const { data: householdId } = useQuery({
    queryKey: ['current-household'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) throw error;
      return data?.household_id;
    },
  });

  const { removeTask, undoRemove, dismissConfirmPill, actionState, isProcessing } = useTaskActions(householdId || "");

  const handleRemoveTask = async (occurrence: any, options: ScopeOptions) => {
    if (!householdId) return;
    
    await removeTask({
      occurrenceId: occurrence.id,
      taskId: occurrence.task_id,
      taskName: occurrence.tasks?.name || 'Unknown Task',
      scope: options.scope,
      snoozeUntil: options.snoozeUntil,
      baseDate: date
    });
  };

  if (!date) return null;

  // Calculate totals
  const totalPoints = occurrences.reduce((sum, occ) => 
    sum + ((occ.duration_min || 0) * (occ.difficulty_weight || 1)), 0
  );
  const criticalCount = occurrences.filter(occ => occ.is_critical).length;
  const completedCount = occurrences.filter(occ => occ.status === 'done').length;

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      scheduled: { variant: "default", label: t('scheduled') },
      done: { variant: "secondary", label: t('completed') },
      moved: { variant: "outline", label: t('moved') },
      backlog: { variant: "destructive", label: t('backlog') }
    };
    return variants[status] || variants.scheduled;
  };

  // Get category color using design system
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cleaning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      childcare: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      admin: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
      errands: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      safety: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  // Mock actions
  const handleTaskAction = (taskId: string, action: string) => {
    console.log(`Action ${action} on task ${taskId}`);
    // Here you would implement the actual actions
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left">
              {format(date, 'EEEE, MMMM d, yyyy', { locale })}
            </SheetTitle>
            {householdId && (
              <TaskQuickActions
                householdId={householdId}
                date={date}
                onTaskUpdate={() => window.location.reload()}
              />
            )}
          </div>
          
          {/* Summary */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{t('total_points')}: {Math.round(totalPoints)}</span>
            <span>•</span>
            <span>{completedCount}/{occurrences.length} {t('completed')}</span>
            {criticalCount > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600">{criticalCount} {t('critical')}</span>
              </>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {occurrences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('no_tasks_this_day')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort by time */}
            {occurrences
              .sort((a, b) => (a.start_time || '18:30').localeCompare(b.start_time || '18:30'))
              .map((occ, index) => {
                const statusBadge = getStatusBadge(occ.status);
                
                return (
                  <div key={occ.id || index} className="border rounded-lg p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{occ.tasks?.name || 'Unknown Task'}</h4>
                          {occ.is_critical && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{occ.start_time || '18:30'}</span>
                          <span>•</span>
                          <span>{occ.duration_min || 30}min</span>
                          <span>•</span>
                          <span>{Math.round((occ.duration_min || 30) * (occ.difficulty_weight || 1))} pts</span>
                        </div>
                      </div>
                      
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>

                    {/* Category */}
                    <div>
                      <Badge className={getCategoryColor(occ.tasks?.category || 'other')}>
                        {t(occ.tasks?.category || 'other')}
                      </Badge>
                    </div>

                    {/* Assignee */}
                    {occ.assigned_person && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {occ.people?.first_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <PersonNameDisplay 
                          person={occ.people} 
                          fallback="Unknown"
                          className="text-sm"
                        />
                        
                        {/* Backup person */}
                        {occ.has_backup && occ.backup_person_id && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {t('backup_available')}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Rationale */}
                    {occ.rationale?.reason && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                        <strong>{t('why_me')}:</strong> {occ.rationale.reason}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        {occ.status !== 'done' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskAction(occ.id, 'complete')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('mark_done')}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(occ.id, 'swap')}
                        >
                          <ArrowUpDown className="h-3 w-3 mr-1" />
                          {t('swap')}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(occ.id, 'move')}
                        >
                          <MoveRight className="h-3 w-3 mr-1" />
                          {t('move')}
                        </Button>
                        
                        {occ.is_critical && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskAction(occ.id, 'boost')}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {t('boost')}
                          </Button>
                        )}
                      </div>

                      {/* Remove Task Menu */}
                      <ScopeMenu
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                          >
                            <MoreHorizontal className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        }
                        onSelect={(options) => handleRemoveTask(occ, options)}
                        currentDate={date}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Fairness Hint */}
        {actionState.confirmPill && actionState.confirmPill.shiftedPoints >= 30 && (
          <div className="mt-4">
            <FairnessHint
              shiftedPoints={actionState.confirmPill.shiftedPoints}
            />
          </div>
        )}

        {/* Confirm Pill */}
        {actionState.confirmPill && (
          <ConfirmPill
            message={actionState.confirmPill.message}
            onUndo={undoRemove}
            onDismiss={dismissConfirmPill}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}