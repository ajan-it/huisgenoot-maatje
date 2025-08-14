import React from "react";

export default function TargetSplitHint({ aMinutes, bMinutes }: { aMinutes: number; bMinutes: number }) {
  const total = Math.max(1, aMinutes + bMinutes);
  const aPct = Math.round((aMinutes / total) * 100);
  const bPct = 100 - aPct;
  return (
    <div className="text-xs text-muted-foreground mt-2">
      Doelverdeling met deze invoer: <span className="font-medium">{aPct}%</span> / <span className="font-medium">{bPct}%</span>
      <div className="h-1 w-full bg-muted rounded mt-1 overflow-hidden">
        <div className="h-1 bg-foreground/70" style={{ width: `${aPct}%` }} />
      </div>
    </div>
  );
}