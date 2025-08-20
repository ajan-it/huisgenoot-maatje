import React from "react";
import type { FairnessTrendPoint } from "@/lib/fairness-helpers";

export function FairnessTrend({ points }: { points: FairnessTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No trend data yet
      </div>
    );
  }
  
  const maxScore = Math.max(...points.map(p => p.fairness), 100);
  const minScore = Math.min(...points.map(p => p.fairness), 0);
  const range = maxScore - minScore || 1;
  
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-16">
        {points.map((point, idx) => {
          const heightPercent = ((point.fairness - minScore) / range) * 100;
          const color = point.fairness >= 80 ? 'bg-green-500' : 
                      point.fairness >= 60 ? 'bg-yellow-500' : 'bg-red-500';
          
          return (
            <div key={idx} className="flex-1 flex flex-col justify-end">
              <div 
                className={`${color} rounded-sm min-h-[4px]`}
                style={{ height: `${Math.max(heightPercent, 6)}%` }}
                title={`Week ${new Date(point.weekStart).toLocaleDateString()}: ${point.fairness}/100`}
              />
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Last {points.length} weeks</span>
        <span>{points[points.length - 1]?.fairness}/100</span>
      </div>
    </div>
  );
}