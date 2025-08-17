import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/i18n/I18nProvider";
import { SetupDraftPerson } from "@/hooks/use-setup-draft";
import { SEED_TASKS } from "@/data/seeds";

type Props = {
  person: SetupDraftPerson;
  onUpdate: (updates: Partial<SetupDraftPerson>) => void;
};

export default function OwnershipSelector({ person, onUpdate }: Props) {
  const { t } = useI18n();

  // Filter to only recurring routines for ownership
  const recurringTasks = SEED_TASKS.filter(task => 
    task.tags?.includes("routine") || 
    task.name.toLowerCase().includes("bedtijd") ||
    task.name.toLowerCase().includes("boodschappen") ||
    task.name.toLowerCase().includes("afval")
  );

  const handleOwnershipToggle = (taskId: string, checked: boolean) => {
    const currentOwnership = person.ownership_task_ids || [];
    
    if (checked && currentOwnership.length >= 3) {
      // Max 3 ownership tasks
      return;
    }
    
    const newOwnership = checked 
      ? [...currentOwnership, taskId]
      : currentOwnership.filter(id => id !== taskId);
    
    onUpdate({ ownership_task_ids: newOwnership });
  };

  const handleCoopPreferenceChange = (taskId: string, preference: "lead" | "assist" | "none") => {
    const currentCoopPrefs = person.coop_prefs || {};
    
    onUpdate({ 
      coop_prefs: {
        ...currentCoopPrefs,
        [taskId]: preference
      }
    });
  };

  const isChildcareTask = (taskName: string) => {
    return taskName.toLowerCase().includes("bedtijd") || 
           taskName.toLowerCase().includes("badtijd") ||
           taskName.toLowerCase().includes("ochtend");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          {t("setup.ownership.title")}
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          {t("setup.ownership.help")}
        </p>
        
        <div className="grid gap-2 mt-3 max-h-48 overflow-auto">
          {recurringTasks.map((task) => {
            const isOwned = (person.ownership_task_ids || []).includes(task.id);
            const canSelect = isOwned || (person.ownership_task_ids || []).length < 3;
            
            return (
              <div key={task.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`ownership-${person.id}-${task.id}`}
                  checked={isOwned}
                  onCheckedChange={(checked) => handleOwnershipToggle(task.id, !!checked)}
                  disabled={!canSelect}
                />
                <Label 
                  htmlFor={`ownership-${person.id}-${task.id}`}
                  className={`text-sm ${!canSelect ? 'text-muted-foreground' : ''}`}
                >
                  {task.name}
                </Label>
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {t("setup.ownership.maxThree").replace("{count}", String((person.ownership_task_ids || []).length)).replace("{max}", "3")}
        </p>
      </div>

      <div>
        <Label className="text-base font-medium">
          {t("setup.cooperation.title")}
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          {t("setup.cooperation.help")}
        </p>
        
        <div className="space-y-3 mt-3">
          {recurringTasks.filter(task => isChildcareTask(task.name)).map((task) => (
            <div key={task.id} className="border rounded-lg p-3 space-y-2">
              <Label className="text-sm font-medium">{task.name}</Label>
              <div className="flex gap-2">
                {["lead", "assist", "none"].map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-sm ${
                      (person.coop_prefs?.[task.id] || "none") === pref
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                    onClick={() => handleCoopPreferenceChange(task.id, pref as "lead" | "assist" | "none")}
                  >
                    {t(`setup.cooperation.${pref}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}