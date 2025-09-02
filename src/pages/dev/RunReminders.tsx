import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, Play, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const RunRemindersPage = () => {
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { toast } = useToast();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container py-8">
        <Card className="p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Not Available</h1>
          <p className="text-muted-foreground">
            This development tool is not available in production.
          </p>
        </Card>
      </div>
    );
  }

  const runReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reminders-run');
      
      if (error) throw error;
      
      setLastRun(new Date().toLocaleString());
      toast({
        title: "Success",
        description: `Reminders processed. Sent: ${data?.sent || 0}`,
      });
      
    } catch (error) {
      console.error('Error running reminders:', error);
      toast({
        title: "Error",
        description: "Failed to run reminder function",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-blue-100">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Run Reminders</h1>
            <p className="text-muted-foreground">
              Development tool to manually trigger reminder function
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Development Only</h3>
            <p className="text-sm text-yellow-700">
              This tool manually invokes the reminders-run edge function. 
              In production, this runs automatically every 15 minutes via cron.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Trigger Reminder Check</h3>
              <p className="text-sm text-muted-foreground">
                Process all critical tasks and send due reminder emails
              </p>
            </div>
            <Button 
              onClick={runReminders} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Now
                </>
              )}
            </Button>
          </div>

          {lastRun && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Last Run</h4>
              <p className="text-sm text-green-700">{lastRun}</p>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-medium text-foreground">What this does:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Checks all households with email reminders enabled</li>
              <li>Finds critical tasks in T-24h, T-2h, and overdue windows</li>
              <li>Sends gentle reminder emails (respects quiet hours)</li>
              <li>Updates reminder_level to prevent duplicates</li>
              <li>Logs results for debugging</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RunRemindersPage;