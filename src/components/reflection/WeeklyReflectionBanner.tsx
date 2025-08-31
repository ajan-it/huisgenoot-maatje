import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock } from "lucide-react";

interface WeeklyReflectionBannerProps {
  weekStart: string;
  onStartReflection: () => void;
  hasReflection?: boolean;
}

export function WeeklyReflectionBanner({ 
  weekStart, 
  onStartReflection, 
  hasReflection 
}: WeeklyReflectionBannerProps) {
  if (hasReflection) {
    return null; // Don't show banner if reflection already completed
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-white shadow-sm">
          <Heart className="h-4 w-4 text-rose-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            Life happens ❤️ — how did this week go?
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Log disruptions (2 min) so next week's plan is kinder to your real life.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">2 min</span>
          <Button 
            onClick={onStartReflection}
            className="ml-2"
            size="sm"
          >
            Start reflection
          </Button>
        </div>
      </div>
    </Card>
  );
}