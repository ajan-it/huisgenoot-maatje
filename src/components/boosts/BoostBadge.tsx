import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Clock } from "lucide-react";

interface BoostBadgeProps {
  isCritical?: boolean;
  hasBackup?: boolean;
  boostEnabled?: boolean;
  variant?: "critical" | "backup" | "boosted" | "reminded" | "overdue";
  reminderLevel?: number;
  isOverdue?: boolean;
}

export function BoostBadge({ 
  isCritical, 
  hasBackup, 
  boostEnabled, 
  variant,
  reminderLevel,
  isOverdue
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

  if (variant === "reminded" || (reminderLevel && reminderLevel >= 1)) {
    return (
      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
        <Clock className="h-3 w-3 mr-1" />
        Reminded
      </Badge>
    );
  }

  if (variant === "overdue" || isOverdue) {
    return (
      <Badge variant="destructive" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Overdue
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