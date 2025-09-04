import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HouseholdData } from "@/hooks/useReminderTester";
import { Loader2 } from "lucide-react";

interface HouseholdSelectorProps {
  selectedHousehold: HouseholdData | null;
  onHouseholdChange: (household: HouseholdData | null) => void;
}

export function HouseholdSelector({ selectedHousehold, onHouseholdChange }: HouseholdSelectorProps) {
  const [households, setHouseholds] = useState<HouseholdData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const fetchHouseholds = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get households where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.user.id);

      if (memberError) throw memberError;

      if (!memberships?.length) {
        setHouseholds([]);
        return;
      }

      const householdIds = memberships.map(m => m.household_id);

      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('id, settings, reminder_settings')
        .in('id', householdIds);

      if (householdError) throw householdError;

      setHouseholds(householdData || []);
    } catch (error) {
      console.error('Error fetching households:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseholdSelect = (householdId: string) => {
    const household = households.find(h => h.id === householdId);
    onHouseholdChange(household || null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading households...</span>
      </div>
    );
  }

  if (!households.length) {
    return (
      <div className="text-muted-foreground">
        No households found. You need to be a member of at least one household.
      </div>
    );
  }

  const reminderSettings = selectedHousehold?.reminder_settings;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Select Household</label>
        <Select 
          value={selectedHousehold?.id || ""} 
          onValueChange={handleHouseholdSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a household to test..." />
          </SelectTrigger>
          <SelectContent>
            {households.map((household) => (
              <SelectItem key={household.id} value={household.id}>
                Household {household.id.slice(0, 8)}...
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedHousehold && reminderSettings && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Reminder Settings</h4>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={reminderSettings.email_enabled ? "default" : "secondary"}>
              Email: {reminderSettings.email_enabled ? "On" : "Off"}
            </Badge>
            <Badge variant={reminderSettings.morning_helper_enabled ? "default" : "secondary"}>
              Morning Helper: {reminderSettings.morning_helper_enabled ? "On" : "Off"}
            </Badge>
            {reminderSettings.quiet_hours && (
              <Badge variant="outline">
                Quiet Hours: {reminderSettings.quiet_hours.start} - {reminderSettings.quiet_hours.end}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}