import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Leaf, Snowflake, Sun, TreePine } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SeasonalTasksToggleProps {
  showSeasonal: boolean;
  onToggle: (show: boolean) => void;
  currentSeason?: 'spring' | 'summer' | 'autumn' | 'winter';
}

const seasonConfig = {
  spring: {
    icon: Leaf,
    label: 'Lente',
    months: 'Mrt-Mei',
    color: 'bg-emerald-500',
  },
  summer: {
    icon: Sun,
    label: 'Zomer',
    months: 'Jun-Aug',
    color: 'bg-amber-500',
  },
  autumn: {
    icon: TreePine,
    label: 'Herfst',
    months: 'Sep-Nov',
    color: 'bg-orange-500',
  },
  winter: {
    icon: Snowflake,
    label: 'Winter',
    months: 'Dec-Feb',
    color: 'bg-blue-500',
  },
};

export function SeasonalTasksToggle({ showSeasonal, onToggle, currentSeason }: SeasonalTasksToggleProps) {
  const currentSeasonConfig = currentSeason ? seasonConfig[currentSeason] : null;
  const CurrentSeasonIcon = currentSeasonConfig?.icon;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center space-x-2">
        <Switch
          id="seasonal-tasks"
          checked={showSeasonal}
          onCheckedChange={onToggle}
        />
        <Label htmlFor="seasonal-tasks" className="font-medium">
          Seizoenstaken
        </Label>
      </div>
      
      {showSeasonal && currentSeasonConfig && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CurrentSeasonIcon className="h-3 w-3" />
            {currentSeasonConfig.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {currentSeasonConfig.months}
          </span>
        </div>
      )}

      {showSeasonal && (
        <div className="flex gap-1 ml-auto">
          {Object.entries(seasonConfig).map(([season, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={season}
                className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center`}
                title={`${config.label} (${config.months})`}
              >
                <Icon className="h-3 w-3 text-white" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}