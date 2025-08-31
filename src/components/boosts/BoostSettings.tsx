import React from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Zap, Clock, MessageSquare, Mail, Smartphone } from "lucide-react";
import type { BoostSettings, BoostChannel } from "@/types/disruptions";

interface BoostSettingsProps {
  settings: BoostSettings;
  onUpdate: (settings: BoostSettings) => void;
}

export function BoostSettingsComponent({ settings, onUpdate }: BoostSettingsProps) {
  const updateSetting = (key: keyof BoostSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const updateAutoSuggest = (category: string, enabled: boolean) => {
    onUpdate({
      ...settings,
      auto_suggest: {
        ...settings.auto_suggest,
        [category]: enabled
      }
    });
  };

  const updateQuietHours = (field: 'start' | 'end', value: string) => {
    onUpdate({
      ...settings,
      quiet_hours: {
        ...settings.quiet_hours,
        [field]: value
      }
    });
  };

  const toggleChannel = (channel: BoostChannel) => {
    const channels = settings.channels.includes(channel)
      ? settings.channels.filter(c => c !== channel)
      : [...settings.channels, channel];
    updateSetting('channels', channels);
  };

  const channelIcons = {
    push: MessageSquare,
    email: Mail,
    whatsapp: Smartphone,
    sms: Smartphone
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-amber-100">
          <Zap className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Boost Settings</h2>
          <p className="text-sm text-muted-foreground">
            Gentle reminders and backup options for critical tasks
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="font-medium">
              Enable Boosts
            </Label>
            <p className="text-sm text-muted-foreground">
              Get helpful reminders and backup options for important tasks
            </p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <>
            <Separator />

            {/* Notification channels */}
            <div>
              <Label className="font-medium mb-3 block">Preferred Channels</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(channelIcons) as BoostChannel[]).map(channel => {
                  const Icon = channelIcons[channel];
                  return (
                    <div
                      key={channel}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.channels.includes(channel)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => toggleChannel(channel)}
                    >
                      <Checkbox
                        checked={settings.channels.includes(channel)}
                        onCheckedChange={() => {}}
                      />
                      <Icon className="h-4 w-4" />
                      <span className="text-sm capitalize">{channel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quiet hours */}
            <div>
              <Label className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Quiet Hours
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="start-time" className="text-sm">From</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={settings.quiet_hours.start}
                    onChange={(e) => updateQuietHours('start', e.target.value)}
                    className="w-auto"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end-time" className="text-sm">To</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={settings.quiet_hours.end}
                    onChange={(e) => updateQuietHours('end', e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No notifications will be sent during these hours
              </p>
            </div>

            {/* Auto-suggest categories */}
            <div>
              <Label className="font-medium mb-3 block">Auto-suggest Boosts For</Label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(settings.auto_suggest).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={enabled}
                        onCheckedChange={(checked) => updateAutoSuggest(category, checked as boolean)}
                      />
                      <Label htmlFor={category} className="capitalize">
                        {category === 'admin' ? 'Bills & Admin' : category}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {category === 'admin' && 'Bills, appointments, paperwork'}
                      {category === 'childcare' && 'Pickup, bedtime, school tasks'}
                      {category === 'errands' && 'Shopping, appointments, deliveries'}
                      {category === 'maintenance' && 'Repairs, appliance care'}
                      {category === 'safety' && 'Smoke alarms, car maintenance'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}