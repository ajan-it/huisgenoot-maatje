import React from "react";
import type { EveningLoad } from "@/lib/fairness-helpers";

export function EveningLoadStrips({ dates }: { dates: EveningLoad[] }) {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const shortDays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  
  return (
    <div className="flex gap-1">
      {shortDays.map((day, idx) => {
        // Find the load for this day (simplified - would need better date matching)
        const load = dates[idx] || { date: '', minutes: 0 };
        const isOverload = load.minutes > 40;
        
        return (
          <div key={day} className="flex-1 text-center">
            <div className="text-xs text-muted-foreground mb-1">{day}</div>
            <div 
              className={`h-2 rounded-sm ${
                isOverload ? 'bg-orange-500' : 'bg-muted'
              }`}
              title={`${weekdays[idx]}: ${load.minutes} min`}
            />
          </div>
        );
      })}
    </div>
  );
}