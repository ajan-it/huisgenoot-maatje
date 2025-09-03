import React from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ChipType = "light" | "normal" | "busy";

type Props = {
  adultsCount: number;
  childrenCount: number;
  currentMinutes?: number;
  onSelectMinutes: (minutes: number) => void;
};

export default function MinutesQuickChips({ adultsCount, childrenCount, currentMinutes, onSelectMinutes }: Props) {
  const { t } = useI18n();
  
  // Updated preset values
  const lightMinutes = 120;   // Light load → 120 min/week, 20 min per weeknight
  const regularMinutes = 150; // Regular load → 150 min/week, 30 min per weeknight  
  const heavyMinutes = 180;   // Heavy load → 180 min/week, 40 min per weeknight

  const getSelectedChip = (): ChipType | null => {
    if (!currentMinutes) return null;
    if (currentMinutes === lightMinutes) return "light";
    if (currentMinutes === regularMinutes) return "normal";
    if (currentMinutes === heavyMinutes) return "busy";
    return null;
  };

  const selectedChip = getSelectedChip();

  const chips: { type: ChipType; minutes: number; label: string }[] = [
    { 
      type: "light", 
      minutes: lightMinutes, 
      label: "Light (2h/week)"
    },
    { 
      type: "normal", 
      minutes: regularMinutes, 
      label: "Regular (2.5h/week)"
    },
    { 
      type: "busy", 
      minutes: heavyMinutes, 
      label: "Heavy (3h/week)"
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 mt-2">
        {chips.map(({ type, minutes, label }) => (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-3 text-xs ${
                  selectedChip === type 
                    ? "bg-primary/5 border-primary/30 text-primary" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectMinutes(minutes)}
              >
                {label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{minutes} minutes per week</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}