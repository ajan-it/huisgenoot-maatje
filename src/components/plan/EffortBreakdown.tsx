import React from "react";
import { Progress } from "@/components/ui/progress";
import type { TypeBreakdown } from "@/lib/fairness-helpers";

interface EffortBreakdownProps {
  aName: string;
  bName: string;
  a: TypeBreakdown;
  b: TypeBreakdown;
}

const categoryColors = {
  kitchen: "bg-orange-500",
  cleaning: "bg-blue-500", 
  childcare: "bg-purple-500",
  errands: "bg-green-500",
  admin: "bg-yellow-500",
  maintenance: "bg-red-500",
  other: "bg-gray-500"
};

const categoryLabels = {
  kitchen: { en: "Kitchen", nl: "Keuken" },
  cleaning: { en: "Cleaning", nl: "Schoonmaken" },
  childcare: { en: "Childcare", nl: "Kinderopvang" },
  errands: { en: "Errands", nl: "Boodschappen" },
  admin: { en: "Admin", nl: "Administratie" },
  maintenance: { en: "Maintenance", nl: "Onderhoud" },
  other: { en: "Other", nl: "Overig" }
};

export function EffortBreakdown({ aName, bName, a, b }: EffortBreakdownProps) {
  const totalA = Object.values(a).reduce((sum, points) => sum + points, 0);
  const totalB = Object.values(b).reduce((sum, points) => sum + points, 0);
  const totalOverall = totalA + totalB;

  if (totalOverall === 0) {
    return <div className="text-sm text-muted-foreground">No effort data available</div>;
  }

  // Get all categories present in either person's data
  const allCategories = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));

  return (
    <div className="space-y-4">
      {/* Person A */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">{aName}</h4>
          <span className="text-sm text-muted-foreground">{totalA} pts</span>
        </div>
        <div className="relative">
          {/* Stacked bar for Person A */}
          <div className="flex h-4 bg-muted rounded-sm overflow-hidden">
            {allCategories.map(category => {
              const points = a[category] || 0;
              const percentage = totalA > 0 ? (points / totalA) * 100 : 0;
              const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;
              
              return percentage > 0 ? (
                <div
                  key={category}
                  className={`${colorClass} flex items-center justify-center text-xs text-white font-medium`}
                  style={{ width: `${percentage}%` }}
                  title={`${categoryLabels[category as keyof typeof categoryLabels]?.en || category}: ${points} pts`}
                >
                  {percentage > 10 && points > 0 && <span>{Math.round(percentage)}%</span>}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Person B */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">{bName}</h4>
          <span className="text-sm text-muted-foreground">{totalB} pts</span>
        </div>
        <div className="relative">
          {/* Stacked bar for Person B */}
          <div className="flex h-4 bg-muted rounded-sm overflow-hidden">
            {allCategories.map(category => {
              const points = b[category] || 0;
              const percentage = totalB > 0 ? (points / totalB) * 100 : 0;
              const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;
              
              return percentage > 0 ? (
                <div
                  key={category}
                  className={`${colorClass} flex items-center justify-center text-xs text-white font-medium`}
                  style={{ width: `${percentage}%` }}
                  title={`${categoryLabels[category as keyof typeof categoryLabels]?.en || category}: ${points} pts`}
                >
                  {percentage > 10 && points > 0 && <span>{Math.round(percentage)}%</span>}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {allCategories.map(category => {
          const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;
          const label = categoryLabels[category as keyof typeof categoryLabels]?.en || category;
          const totalPoints = (a[category] || 0) + (b[category] || 0);
          
          return totalPoints > 0 ? (
            <div key={category} className="flex items-center gap-1">
              <div className={`w-3 h-3 ${colorClass} rounded-sm`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}