import React from "react";
import type { DifficultyCount } from "@/lib/fairness-helpers";

export function HardEasyBreakdown({
  aName,
  bName,
  aCounts,
  bCounts
}: {
  aName: string;
  bName: string;
  aCounts: DifficultyCount;
  bCounts: DifficultyCount;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Person A */}
        <div>
          <h4 className="font-medium mb-3">{aName}</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                Hard (≥40 pts)
              </span>
              <span className="font-medium">{aCounts.hard}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                Medium (20-39 pts)
              </span>
              <span className="font-medium">{aCounts.medium}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                Easy (&lt;20 pts)
              </span>
              <span className="font-medium">{aCounts.easy}</span>
            </div>
          </div>
        </div>
        
        {/* Person B */}
        <div>
          <h4 className="font-medium mb-3">{bName}</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                Hard (≥40 pts)
              </span>
              <span className="font-medium">{bCounts.hard}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                Medium (20-39 pts)
              </span>
              <span className="font-medium">{bCounts.medium}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                Easy (&lt;20 pts)
              </span>
              <span className="font-medium">{bCounts.easy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}