import React from "react";
import type { TypeBreakdown } from "@/lib/fairness-helpers";

const CATEGORY_COLORS = {
  kitchen: "bg-orange-500",
  cleaning: "bg-blue-500",  
  childcare: "bg-pink-500",
  errands: "bg-green-500",
  admin: "bg-purple-500",
  other: "bg-gray-500",
  maintenance: "bg-yellow-600"
};

const CATEGORY_LABELS = {
  kitchen: "Kitchen",
  cleaning: "Cleaning",
  childcare: "Childcare", 
  errands: "Errands",
  admin: "Admin",
  other: "Other",
  maintenance: "Maintenance"
};

export function TaskTypeBreakdown({
  aName,
  bName, 
  a,
  b
}: {
  aName: string;
  bName: string;
  a: TypeBreakdown;
  b: TypeBreakdown;
}) {
  const getTotalPoints = (breakdown: TypeBreakdown) => 
    Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  
  const getPercentage = (points: number, total: number) => 
    total > 0 ? (points / total) * 100 : 0;
  
  const aTotalPoints = getTotalPoints(a);
  const bTotalPoints = getTotalPoints(b);
  
  const allCategories = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Person A */}
        <div>
          <h4 className="font-medium mb-2">{aName}</h4>
          <div className="flex h-4 rounded-lg overflow-hidden bg-muted">
            {allCategories.map(category => {
              const points = a[category] || 0;
              const percentage = getPercentage(points, aTotalPoints);
              if (percentage === 0) return null;
              
              return (
                <div
                  key={category}
                  className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other}
                  style={{ width: `${percentage}%` }}
                  title={`${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}: ${points} pts (${percentage.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {aTotalPoints} total points
          </div>
        </div>
        
        {/* Person B */}
        <div>
          <h4 className="font-medium mb-2">{bName}</h4>
          <div className="flex h-4 rounded-lg overflow-hidden bg-muted">
            {allCategories.map(category => {
              const points = b[category] || 0;
              const percentage = getPercentage(points, bTotalPoints);
              if (percentage === 0) return null;
              
              return (
                <div
                  key={category}
                  className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other}
                  style={{ width: `${percentage}%` }}
                  title={`${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}: ${points} pts (${percentage.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {bTotalPoints} total points
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {allCategories.map(category => (
          <div key={category} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other}`} />
            <span>{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}