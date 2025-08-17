import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { SetupDraftPerson } from "@/hooks/use-setup-draft";

type Props = {
  person: SetupDraftPerson;
  onUpdate: (updates: Partial<SetupDraftPerson>) => void;
  onUpdateBudget: () => void;
};

export default function WorkContextInputs({ person, onUpdate, onUpdateBudget }: Props) {
  const { t } = useI18n();

  const handleWorkLocationChange = (value: "office" | "hybrid" | "home") => {
    onUpdate({ work_location: value });
  };

  const handleFlexibilityChange = (value: number[]) => {
    onUpdate({ flexibility_score: value[0] });
  };

  const handleFairnessStyleChange = (value: number[]) => {
    onUpdate({ fairness_style_alpha: value[0] / 100 }); // Convert 0-30 to 0.0-0.3
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
      <h4 className="font-medium text-sm text-muted-foreground">
        {t("setup.workContext.title")}
      </h4>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("setup.workContext.workplace")}</Label>
          <Select value={person.work_location || "hybrid"} onValueChange={handleWorkLocationChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="office">{t("setup.workContext.office")}</SelectItem>
              <SelectItem value="hybrid">{t("setup.workContext.hybrid")}</SelectItem>
              <SelectItem value="home">{t("setup.workContext.home")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`paid-hours-${person.id}`}>
            {t("setup.workContext.paidHours")} (0–50)
          </Label>
          <Input
            id={`paid-hours-${person.id}`}
            type="number"
            min={0}
            max={50}
            value={person.paid_hours_per_week ?? ""}
            onChange={(e) => onUpdate({ 
              paid_hours_per_week: e.target.value === "" ? undefined : Math.max(0, Math.min(50, Number(e.target.value)))
            })}
            placeholder="36"
          />
        </div>

        <div>
          <Label htmlFor={`commute-${person.id}`}>
            {t("setup.workContext.commuteMinutes")} (0–120)
          </Label>
          <Input
            id={`commute-${person.id}`}
            type="number"
            min={0}
            max={120}
            value={person.commute_min_per_day ?? ""}
            onChange={(e) => onUpdate({ 
              commute_min_per_day: e.target.value === "" ? undefined : Math.max(0, Math.min(120, Number(e.target.value)))
            })}
            placeholder="30"
          />
        </div>

        <div>
          <Label>{t("setup.workContext.flexibility")}: {person.flexibility_score || 3}</Label>
          <div className="px-2">
            <Slider
              value={[person.flexibility_score || 3]}
              onValueChange={handleFlexibilityChange}
              min={1}
              max={5}
              step={1}
              className="mt-2"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{t("setup.workContext.notFlexible")}</span>
            <span>{t("setup.workContext.veryFlexible")}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <h5 className="font-medium text-sm text-muted-foreground">
          {t("setup.psychology.title")}
        </h5>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{t("setup.psychology.incomeAsymmetry")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("setup.psychology.incomeAsymmetryHelp")}
            </p>
          </div>
          <Switch
            checked={person.income_asymmetry_ack || false}
            onCheckedChange={(checked) => onUpdate({ income_asymmetry_ack: checked })}
          />
        </div>

        {person.income_asymmetry_ack && (
          <div>
            <Label>
              {t("setup.psychology.fairnessStyle")}: α = {((person.fairness_style_alpha || 0.15) * 100).toFixed(0)}%
            </Label>
            <div className="px-2">
              <Slider
                value={[(person.fairness_style_alpha || 0.15) * 100]}
                onValueChange={handleFairnessStyleChange}
                min={0}
                max={30}
                step={5}
                className="mt-2"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{t("setup.psychology.strict5050")}</span>
              <span>{t("setup.psychology.recognizesBreadwinner")}</span>
            </div>
          </div>
        )}
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onUpdateBudget}
        className="w-full"
      >
        {t("setup.workContext.updateEstimate")}
      </Button>
    </div>
  );
}