import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Clock } from "lucide-react";

interface BoostBadgeProps {
  isCritical?: boolean;
  hasBackup?: boolean;
  boostEnabled?: boolean;
  variant?: "critical" | "backup" | "boosted";
}

export function BoostBadge({ 
  isCritical, 
  hasBackup, 
  boostEnabled, 
  variant 
}: BoostBadgeProps) {
  if (variant === "critical" || isCritical) {
    return (
      <Badge variant="destructive" className="text-xs">
        <Zap className="h-3 w-3 mr-1" />
        Critical
      </Badge>
    );
  }

  if (variant === "backup" || hasBackup) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Users className="h-3 w-3 mr-1" />
        Backup ready
      </Badge>
    );
  }

  if (variant === "boosted" || boostEnabled) {
    return (
      <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
        <Zap className="h-3 w-3 mr-1" />
        Boosted
      </Badge>
    );
  }

  return null;
}