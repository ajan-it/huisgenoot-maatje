import React from "react";
import { useI18n } from "@/i18n/I18nProvider";

function splitPercents(minutesByAdult: number[]) {
  const total = Math.max(1, minutesByAdult.reduce((a,b)=>a+b,0));
  return minutesByAdult.map(m => Math.round((m/total)*100));
}

export default function TargetSplitHint({ adultsMinutes }: { adultsMinutes: number[] }) {
  const { t } = useI18n();
  
  if (adultsMinutes.length === 0 || adultsMinutes.every(m => m === 0)) return null;
  
  const percents = splitPercents(adultsMinutes);
  
  if (adultsMinutes.length === 1) {
    return null; // Single adult - no split needed
  }
  
  const splitText = percents.map(p => `${p}%`).join(" / ");
  
  return (
    <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-md">
      <div className="mb-2">
        {t("time.minutes.hint").replace("{split}", splitText)}
      </div>
      <div className="h-2 w-full bg-muted rounded overflow-hidden flex">
        {percents.map((pct, i) => (
          <div 
            key={i}
            className={`h-2 ${i === 0 ? 'bg-foreground/70' : i === 1 ? 'bg-foreground/50' : 'bg-foreground/30'}`}
            style={{ width: `${pct}%` }} 
          />
        ))}
      </div>
    </div>
  );
}