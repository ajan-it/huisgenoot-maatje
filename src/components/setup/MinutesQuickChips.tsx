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

function chipMinutesForAdult(hh: { adults: number; children: number }, which: ChipType) {
  // base ranges by family type
  let L = 60, N = 90, B = 120; // default: couple/no kids or single no kids

  if (hh.children >= 1 && hh.adults === 1) {        // single parent
    L = 180; N = 210; B = 240;
  } else if (hh.children >= 2) {                     // 2+ kids, two adults
    L = 150; N = 180; B = 210;
  } else if (hh.children >= 1) {                     // 1 kid, two adults
    L = 120; N = 150; B = 180;
  } else {                                           // no kids
    L = 60; N = 90; B = 120;
  }

  return which === "light" ? L : which === "busy" ? B : N;
}

export default function MinutesQuickChips({ adultsCount, childrenCount, currentMinutes, onSelectMinutes }: Props) {
  const { t } = useI18n();
  
  const household = { adults: adultsCount, children: childrenCount };
  const lightMinutes = chipMinutesForAdult(household, "light");
  const normalMinutes = chipMinutesForAdult(household, "normal");
  const busyMinutes = chipMinutesForAdult(household, "busy");

  const getSelectedChip = (): ChipType | null => {
    if (!currentMinutes) return null;
    if (currentMinutes === lightMinutes) return "light";
    if (currentMinutes === normalMinutes) return "normal";
    if (currentMinutes === busyMinutes) return "busy";
    return null;
  };

  const selectedChip = getSelectedChip();

  const chips: Array<{ type: ChipType; minutes: number; tooltipKey: string }> = [
    { type: "light", minutes: lightMinutes, tooltipKey: "time.tooltip.light" },
    { type: "normal", minutes: normalMinutes, tooltipKey: "time.tooltip.normal" },
    { type: "busy", minutes: busyMinutes, tooltipKey: "time.tooltip.busy" },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 mt-2">
        {chips.map(({ type, minutes, tooltipKey }) => (
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
                {t(`time.chips.${type}`)} ({minutes})
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{t(tooltipKey)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}