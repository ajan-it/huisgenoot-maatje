import React from "react";
import { Progress } from "@/components/ui/progress";
import { EveningLoadStrips } from "./EveningLoadStrips";
import type { PersonSplit } from "@/lib/fairness-helpers";

export function FairnessBars({ people }: { people: PersonSplit[] }) {
  return (
    <div className="space-y-4">
      {people.map(person => {
        const actualPercent = Math.min(person.actualShare * 100, 100);
        const targetPercent = Math.min(person.targetShare * 100, 100);
        const deltaColor = person.deltaMinutes >= 0 ? "text-orange-600" : "text-green-600";
        const deltaSign = person.deltaMinutes >= 0 ? "+" : "";
        
        return (
          <div key={person.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-lg">{person.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {Math.round(person.actualMinutes)} min • {Math.round(person.actualPoints)} pts
                </p>
              </div>
              <div className={`text-sm font-medium ${deltaColor}`}>
                Δ {deltaSign}{person.deltaMinutes} min
              </div>
            </div>
            
            <div className="relative">
              <Progress value={actualPercent} className="h-3" />
              {/* Target marker */}
              <div 
                className="absolute top-0 h-3 w-1 bg-blue-500 rounded-sm"
                style={{ left: `${targetPercent}%` }}
                title={`Target: ${targetPercent.toFixed(0)}%`}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target {targetPercent.toFixed(0)}%</span>
              <span>Actual {actualPercent.toFixed(0)}%</span>
            </div>
            
            {/* Evening load strips placeholder - would need evening data */}
            <div className="flex gap-1">
              {['Mo', 'Tu', 'We', 'Th', 'Fr'].map((day, idx) => (
                <div key={day} className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{day}</div>
                  <div className="h-2 bg-muted rounded-sm"></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}