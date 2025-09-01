import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  RotateCcw, 
  Repeat,
  Zap
} from "lucide-react";

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'quarterly' | 'semiannual' | 'annual';

interface FrequencyFilterProps {
  selectedFrequencies: FrequencyType[];
  onFrequencyToggle: (frequency: FrequencyType) => void;
}

const frequencyConfig: Record<FrequencyType, { 
  label: string; 
  icon: any; 
  color: string;
  description: string;
}> = {
  daily: {
    label: 'Dagelijks',
    icon: Clock,
    color: 'bg-red-500',
    description: 'Elke dag'
  },
  weekly: {
    label: 'Wekelijks',
    icon: CalendarDays,
    color: 'bg-orange-500',
    description: 'Elke week'
  },
  monthly: {
    label: 'Maandelijks',
    icon: Calendar,
    color: 'bg-blue-500',
    description: 'Elke maand'
  },
  seasonal: {
    label: 'Seizoens',
    icon: RotateCcw,
    color: 'bg-emerald-500',
    description: 'Per seizoen'
  },
  quarterly: {
    label: 'Kwartaal',
    icon: Repeat,
    color: 'bg-purple-500',
    description: 'Elk kwartaal'
  },
  semiannual: {
    label: 'Halfjaarlijks',
    icon: Zap,
    color: 'bg-indigo-500',
    description: '2x per jaar'
  },
  annual: {
    label: 'Jaarlijks',
    icon: Calendar,
    color: 'bg-slate-500',
    description: '1x per jaar'
  }
};

export function FrequencyFilter({ selectedFrequencies, onFrequencyToggle }: FrequencyFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Frequentie</h4>
      <div className="flex flex-wrap gap-2">
        {Object.entries(frequencyConfig).map(([frequency, config]) => {
          const isSelected = selectedFrequencies.includes(frequency as FrequencyType);
          const Icon = config.icon;
          
          return (
            <Button
              key={frequency}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onFrequencyToggle(frequency as FrequencyType)}
              className="flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              <Icon className="h-3 w-3" />
              {config.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}