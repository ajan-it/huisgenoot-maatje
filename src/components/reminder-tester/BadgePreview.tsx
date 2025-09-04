import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { OccurrenceData } from "@/hooks/useReminderTester";
import { format } from "date-fns";

interface BadgePreviewProps {
  occurrence: OccurrenceData;
  householdId?: string;
}

export function BadgePreview({ occurrence, householdId }: BadgePreviewProps) {
  const [freshOccurrence, setFreshOccurrence] = useState<OccurrenceData>(occurrence);
  const [refreshing, setRefreshing] = useState(false);

  const refreshOccurrence = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select(`
          id,
          date,
          start_time,
          due_at,
          reminder_level,
          last_reminded_at,
          is_critical,
          status,
          plan_id,
          tasks(name),
          people(first_name)
        `)
        .eq('id', occurrence.id)
        .single();

      if (error) throw error;

      const transformed = {
        ...occurrence,
        due_at: data.due_at,
        reminder_level: data.reminder_level,
        last_reminded_at: data.last_reminded_at,
        is_critical: data.is_critical,
        status: data.status,
      };

      setFreshOccurrence(transformed);
    } catch (error) {
      console.error('Error refreshing occurrence:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setFreshOccurrence(occurrence);
  }, [occurrence]);

  const isOverdue = () => {
    if (!freshOccurrence.due_at) return false;
    return new Date(freshOccurrence.due_at) < new Date() && freshOccurrence.status !== 'completed';
  };

  const isReminded = () => {
    return freshOccurrence.reminder_level > 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshOccurrence}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Info */}
          <div>
            <h4 className="font-medium mb-2">{freshOccurrence.task_name}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Date: {format(new Date(freshOccurrence.date), 'MMM dd, yyyy')}</div>
              <div>Assigned to: {freshOccurrence.assigned_person}</div>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium mb-2">Status Badges</h5>
              <div className="flex gap-2 flex-wrap">
                <Badge className={getStatusColor(freshOccurrence.status)}>
                  {freshOccurrence.status}
                </Badge>
                
                {freshOccurrence.is_critical && (
                  <Badge variant="destructive">
                    Critical
                  </Badge>
                )}
                
                {isOverdue() && (
                  <Badge variant="destructive">
                    Overdue
                  </Badge>
                )}
                
                {isReminded() && (
                  <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                    Reminded (Level {freshOccurrence.reminder_level})
                  </Badge>
                )}
              </div>
            </div>

            {/* Timing Info */}
            <div>
              <h5 className="text-sm font-medium mb-2">Timing Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Due At:</span>
                  <div className="font-mono">
                    {freshOccurrence.due_at 
                      ? format(new Date(freshOccurrence.due_at), 'yyyy-MM-dd HH:mm:ss')
                      : 'Not set'
                    }
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Reminded:</span>
                  <div className="font-mono">
                    {freshOccurrence.last_reminded_at 
                      ? format(new Date(freshOccurrence.last_reminded_at), 'yyyy-MM-dd HH:mm:ss')
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Time-based Analysis */}
            <div>
              <h5 className="text-sm font-medium mb-2">Reminder Window Analysis</h5>
              {freshOccurrence.due_at ? (
                <div className="text-sm space-y-1">
                  {(() => {
                    const dueDate = new Date(freshOccurrence.due_at);
                    const now = new Date();
                    const diffMs = dueDate.getTime() - now.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    
                    if (diffHours < -1) {
                      return <div className="text-destructive">⚠️ Overdue window (due_at is in the past)</div>;
                    } else if (diffHours <= 2) {
                      return <div className="text-orange-600">🕐 T-2h window (due within 2 hours)</div>;
                    } else if (diffHours <= 24) {
                      return <div className="text-blue-600">📅 T-24h window (due within 24 hours)</div>;
                    } else {
                      return <div className="text-muted-foreground">⏰ Not in any reminder window</div>;
                    }
                  })()}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No due date set - won't trigger reminders</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open(`/plan/${freshOccurrence.plan_id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View in Plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open('/my', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View My Tasks
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Open these pages to verify that badges appear correctly in the main application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}