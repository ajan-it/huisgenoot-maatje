import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, RefreshCw } from "lucide-react";

interface RunAndLogsProps {
  householdId?: string;
}

export function RunAndLogs({ householdId }: RunAndLogsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const runReminders = async () => {
    if (!householdId) {
      toast({
        title: "Error",
        description: "No household selected",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setLogs('Starting reminder run...\n');

    try {
      const { data, error } = await supabase.functions.invoke('reminders-run', {
        body: { origin: 'ui/dev' }
      });

      if (error) throw error;

      setLastResult(data);
      setLogs(prev => prev + `\nRun completed successfully!\nResult: ${JSON.stringify(data, null, 2)}\n`);

      toast({
        title: "Reminders Run Complete",
        description: `Sent ${data?.total_sent || 0} reminders`,
      });
    } catch (error) {
      console.error('Error running reminders:', error);
      setLogs(prev => prev + `\nError: ${error.message}\n`);
      toast({
        title: "Error",
        description: "Failed to run reminders",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      // For now, we'll use a simpler approach since supabase_analytics_query might not be available
      setLogs('Fetching logs is not yet implemented in this version. Use the Supabase Dashboard to view edge function logs.');
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Error fetching logs: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex gap-2">
        <Button
          onClick={runReminders}
          disabled={isRunning || !householdId}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Reminders Now
        </Button>

        <Button
          variant="outline"
          onClick={fetchRecentLogs}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Fetch Recent Logs
        </Button>
      </div>

      {/* Result Summary */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Run Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default" className="text-sm">
                Total Sent: {lastResult.total_sent || 0}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Households Processed: {lastResult.households_processed || 0}
              </Badge>
              {lastResult.quiet_hours !== undefined && (
                <Badge variant={lastResult.quiet_hours ? "outline" : "secondary"} className="text-sm">
                  Quiet Hours: {lastResult.quiet_hours ? "Yes" : "No"}
                </Badge>
              )}
            </div>

            {lastResult.total_sent === 0 && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>No reminders sent.</strong> This could be because:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>No occurrences match the time windows (T-24h, T-2h, overdue)</li>
                  <li>Occurrences don't have active status (e.g., already completed)</li>
                  <li>It's during quiet hours and reminders are suppressed</li>
                  <li>Reminder level already set (not reset)</li>
                </ul>
              </div>
            )}

            {lastResult.active_statuses && (
              <div className="text-sm">
                <p className="font-medium">Active Statuses Used:</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {lastResult.active_statuses.map((status: string) => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Log Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Function Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={logs}
            readOnly
            placeholder="Logs will appear here when you run reminders or fetch recent logs..."
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}