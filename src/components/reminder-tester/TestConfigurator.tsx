import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TestConfig, OriginalValues, OccurrenceData } from "@/hooks/useReminderTester";
import { format, addHours, addMinutes, subHours } from "date-fns";
import { Info, RotateCcw, Save } from "lucide-react";

interface TestConfiguratorProps {
  testConfig: TestConfig;
  onConfigChange: (config: TestConfig) => void;
  onApply: () => void;
  onRevert: () => void;
  canRevert: boolean;
  originalValues: OriginalValues | null;
  selectedOccurrence: OccurrenceData;
}

export function TestConfigurator({
  testConfig,
  onConfigChange,
  onApply,
  onRevert,
  canRevert,
  originalValues,
  selectedOccurrence
}: TestConfiguratorProps) {
  const [customDateTime, setCustomDateTime] = useState('');

  const handleTimingChange = (timing: TestConfig['timing']) => {
    onConfigChange({ ...testConfig, timing });
  };

  const handleCustomDateTimeChange = (value: string) => {
    setCustomDateTime(value);
    if (value) {
      onConfigChange({ 
        ...testConfig, 
        timing: 'custom',
        customDate: new Date(value)
      });
    }
  };

  const getPreviewDueAt = () => {
    const now = new Date();
    switch (testConfig.timing) {
      case 'T-24h':
        return addHours(now, 25);
      case 'T-2h':
        return addMinutes(now, 110);
      case 'overdue':
        return subHours(now, 25);
      case 'custom':
        return testConfig.customDate || now;
      default:
        return now;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Current Values */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <h4 className="font-medium mb-3">Current Values</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Due At:</span>
                <div className="font-mono">
                  {selectedOccurrence.due_at 
                    ? format(new Date(selectedOccurrence.due_at), 'yyyy-MM-dd HH:mm:ss')
                    : 'Not set'
                  }
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Critical:</span>
                <div className="font-mono">
                  {selectedOccurrence.is_critical ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Reminder Level:</span>
                <div className="font-mono">
                  {selectedOccurrence.reminder_level}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Reminded:</span>
                <div className="font-mono">
                  {selectedOccurrence.last_reminded_at 
                    ? format(new Date(selectedOccurrence.last_reminded_at), 'yyyy-MM-dd HH:mm:ss')
                    : 'Never'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing Configuration */}
        <div>
          <h4 className="font-medium mb-3">Reminder Timing</h4>
          <RadioGroup value={testConfig.timing} onValueChange={handleTimingChange}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="T-24h" id="t-24h" />
                <Label htmlFor="t-24h" className="flex items-center gap-2">
                  T-24h (Tomorrow +1h)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sets due_at to 25 hours from now. Should trigger T-24h reminder window.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="T-2h" id="t-2h" />
                <Label htmlFor="t-2h" className="flex items-center gap-2">
                  T-2h (Soon)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sets due_at to 110 minutes from now. Should trigger T-2h reminder window.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overdue" id="overdue" />
                <Label htmlFor="overdue" className="flex items-center gap-2">
                  Overdue
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sets due_at to 25 hours ago. Should trigger overdue reminder window.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom Date/Time</Label>
              </div>
            </div>

            {testConfig.timing === 'custom' && (
              <div className="mt-4">
                <Input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Additional Options</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="mark-critical">Mark as Critical</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sets is_critical = true. Critical tasks may have different reminder behavior.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="mark-critical"
              checked={testConfig.markCritical}
              onCheckedChange={(checked) => onConfigChange({ ...testConfig, markCritical: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="reset-reminder">Reset Reminder Level</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resets reminder_level to 0 and last_reminded_at to NULL, allowing fresh reminders.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="reset-reminder"
              checked={testConfig.resetReminderLevel}
              onCheckedChange={(checked) => onConfigChange({ ...testConfig, resetReminderLevel: checked })}
            />
          </div>
        </div>

        {/* Preview */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <h4 className="font-medium mb-2 text-blue-900">Preview</h4>
            <div className="text-sm space-y-1 text-blue-800">
              <div>
                <span className="font-medium">New due_at:</span> {format(getPreviewDueAt(), 'yyyy-MM-dd HH:mm:ss')}
              </div>
              <div>
                <span className="font-medium">Critical:</span> {testConfig.markCritical ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Reminder level:</span> {testConfig.resetReminderLevel ? '0 (reset)' : 'unchanged'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={onApply} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Apply Test Configuration
          </Button>
          
          {canRevert && (
            <Button variant="outline" onClick={onRevert} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Revert to Original
            </Button>
          )}
        </div>

        {originalValues && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2 text-yellow-900">Original Values (for revert)</h4>
              <div className="text-sm space-y-1 text-yellow-800">
                <div>Due At: {originalValues.due_at ? format(new Date(originalValues.due_at), 'yyyy-MM-dd HH:mm:ss') : 'Not set'}</div>
                <div>Critical: {originalValues.is_critical ? 'Yes' : 'No'}</div>
                <div>Reminder Level: {originalValues.reminder_level}</div>
                <div>Last Reminded: {originalValues.last_reminded_at ? format(new Date(originalValues.last_reminded_at), 'yyyy-MM-dd HH:mm:ss') : 'Never'}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}