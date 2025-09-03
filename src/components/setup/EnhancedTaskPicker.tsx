import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDownIcon, 
  SearchIcon, 
  CheckCircle2, 
  Clock, 
  Star,
  ChefHat,
  Sparkles,
  Baby,
  Car,
  Wrench,
  TreePine
} from "lucide-react";
import { SEED_TASKS } from "@/data/seeds";
import { Frequency } from "@/types/models";
import { useI18n } from "@/i18n/I18nProvider";

interface TaskPickerProps {
  selectedTasks: Array<{
    id: string;
    active: boolean;
    frequency?: Frequency;
    duration?: number;
    weekend_only?: boolean;
    avoid_evenings?: boolean;
  }>;
  onTasksChange: (tasks: Array<{
    id: string;
    active: boolean;
    frequency?: Frequency;
    duration?: number;
    weekend_only?: boolean;
    avoid_evenings?: boolean;
  }>) => void;
  adultsCount: number;
  totalMinutesBudget: number;
}

// Category configuration with icons and priority
const CATEGORIES = [
  { 
    id: "kitchen", 
    icon: ChefHat, 
    color: "bg-orange-500", 
    essential: true,
    description: "Daily meal preparation and kitchen tasks"
  },
  { 
    id: "cleaning", 
    icon: Sparkles, 
    color: "bg-blue-500", 
    essential: true,
    description: "Regular cleaning and laundry tasks"
  },
  { 
    id: "childcare", 
    icon: Baby, 
    color: "bg-pink-500", 
    essential: true,
    description: "Childcare routines and transportation"
  },
  { 
    id: "errands", 
    icon: Car, 
    color: "bg-green-500", 
    essential: true,
    description: "Shopping and errands outside the home"
  },
  { 
    id: "appliance", 
    icon: Wrench, 
    color: "bg-purple-500", 
    essential: false,
    description: "Appliance maintenance and safety checks"
  },
  { 
    id: "garden", 
    icon: TreePine, 
    color: "bg-emerald-500", 
    essential: false,
    description: "Garden care and outdoor maintenance"
  },
];

// Quick start packs for immediate setup
const QUICK_START_PACKS = [
  {
    id: "pack_apartment",
    name: "Apartment Living",
    description: "Essential tasks for apartment dwellers",
    icon: "🏠",
    tasks: ["t1", "t2", "t5", "t6", "t7", "t9", "t11", "t12", "t19", "t21", "t23"]
  },
  {
    id: "pack_house_garden", 
    name: "House with Garden",
    description: "Complete household including outdoor tasks",
    icon: "🏡",
    tasks: ["t1", "t2", "t5", "t6", "t7", "t9", "t11", "t12", "t19", "t21", "t23", "sea1", "sea2", "o1"]
  },
  {
    id: "pack_schoolkids",
    name: "Family with School Kids",
    description: "Tasks for families with children",
    icon: "👨‍👩‍👧‍👦",
    tasks: ["t1", "t2", "t3", "t5", "t6", "t15", "t16", "t17", "t18", "t7", "t9", "t11", "t12", "t19"]
  }
];

export function EnhancedTaskPicker({ 
  selectedTasks, 
  onTasksChange, 
  adultsCount, 
  totalMinutesBudget 
}: TaskPickerProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["kitchen", "cleaning", "childcare"]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedQuickStart, setSelectedQuickStart] = useState<string | null>(null);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped = SEED_TASKS.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, typeof SEED_TASKS>);

    // Filter by search if needed
    if (search.trim()) {
      Object.keys(grouped).forEach(category => {
        grouped[category] = grouped[category].filter(task =>
          task.name.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    return grouped;
  }, [search]);

  const getTaskConfig = (taskId: string) => {
    return selectedTasks.find(t => t.id === taskId) || { id: taskId, active: false };
  };

  const updateTask = (taskId: string, updates: Partial<typeof selectedTasks[0]>) => {
    const newTasks = [...selectedTasks];
    const index = newTasks.findIndex(t => t.id === taskId);
    
    if (index >= 0) {
      newTasks[index] = { ...newTasks[index], ...updates };
    } else {
      newTasks.push({ id: taskId, active: false, ...updates });
    }
    
    onTasksChange(newTasks);
  };

  const handleQuickStart = (packId: string) => {
    const pack = QUICK_START_PACKS.find(p => p.id === packId);
    if (!pack) return;

    const newTasks = [...selectedTasks];
    
    // First, deactivate all tasks if switching packs
    newTasks.forEach(task => task.active = false);
    
    // Activate pack tasks
    pack.tasks.forEach(taskId => {
      const seedTask = SEED_TASKS.find(t => t.id === taskId);
      if (!seedTask) return;
      
      const index = newTasks.findIndex(t => t.id === taskId);
      const config = {
        id: taskId,
        active: true,
        frequency: seedTask.frequency,
        duration: seedTask.default_duration,
        weekend_only: false,
        avoid_evenings: false,
      };
      
      if (index >= 0) {
        newTasks[index] = { ...newTasks[index], ...config };
      } else {
        newTasks.push(config);
      }
    });
    
    onTasksChange(newTasks);
    setSelectedQuickStart(packId);
    
    // Auto-expand relevant categories
    const relevantCategories = pack.tasks
      .map(taskId => SEED_TASKS.find(t => t.id === taskId)?.category)
      .filter((cat, index, arr) => cat && arr.indexOf(cat) === index) as string[];
    setExpandedCategories(relevantCategories);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleCategoryTasks = (categoryId: string, selectAll: boolean) => {
    const categoryTasks = tasksByCategory[categoryId] || [];
    const newTasks = [...selectedTasks];
    
    categoryTasks.forEach(task => {
      const index = newTasks.findIndex(t => t.id === task.id);
      const config = {
        id: task.id,
        active: selectAll,
        frequency: task.frequency,
        duration: task.default_duration,
        weekend_only: false,
        avoid_evenings: false,
      };
      
      if (index >= 0) {
        newTasks[index] = { ...newTasks[index], ...config };
      } else if (selectAll) {
        newTasks.push(config);
      }
    });
    
    onTasksChange(newTasks);
  };

  // Calculate stats
  const activeTasks = selectedTasks.filter(t => t.active);
  const estimatedMinutesPerWeek = activeTasks.reduce((sum, task) => {
    const seedTask = SEED_TASKS.find(t => t.id === task.id);
    if (!seedTask) return sum;
    
    const duration = task.duration || seedTask.default_duration;
    const frequency = task.frequency || seedTask.frequency;
    
    let weeklyMultiplier = 1;
    switch (frequency) {
      case "daily": weeklyMultiplier = 7; break;
      case "two_per_week": weeklyMultiplier = 2; break;
      case "three_per_week": weeklyMultiplier = 3; break;
      case "weekly": weeklyMultiplier = 1; break;
      case "biweekly": weeklyMultiplier = 0.5; break;
      case "monthly": weeklyMultiplier = 0.25; break;
      case "quarterly": weeklyMultiplier = 0.08; break;
      case "semiannual": weeklyMultiplier = 0.04; break;
      case "annual": weeklyMultiplier = 0.02; break;
      case "seasonal": weeklyMultiplier = 0.1; break;
      default: weeklyMultiplier = 1;
    }
    
    return sum + (duration * weeklyMultiplier);
  }, 0);

  const minutesPerAdult = estimatedMinutesPerWeek / Math.max(adultsCount, 1);
  const fairnessScore = totalMinutesBudget > 0 ? Math.min(100, Math.round((minutesPerAdult / totalMinutesBudget) * 100)) : 0;

  const visibleCategories = CATEGORIES.filter(cat => 
    showAdvanced || cat.essential
  );

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Quick Start
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose a starter pack that matches your situation, then customize as needed.
          </p>
        </div>
        
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_START_PACKS.map(pack => (
            <Card 
              key={pack.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedQuickStart === pack.id ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleQuickStart(pack.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{pack.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{pack.name}</h4>
                    <p className="text-xs text-muted-foreground">{pack.description}</p>
                  </div>
                  {selectedQuickStart === pack.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {visibleCategories.map(category => {
          const Icon = category.icon;
          const categoryTasks = tasksByCategory[category.id] || [];
          const activeCategoryTasks = categoryTasks.filter(task => 
            getTaskConfig(task.id).active
          );
          const isExpanded = expandedCategories.includes(category.id);
          
          if (categoryTasks.length === 0) return null;

          return (
            <Card key={category.id} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-base">
                            {t(`tasks.${category.id}`)} ({activeCategoryTasks.length}/{categoryTasks.length})
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeCategoryTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {activeCategoryTasks.length} active
                          </Badge>
                        )}
                        <ChevronDownIcon 
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Category controls */}
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <p className="text-sm text-muted-foreground">
                        Click tasks to add them to your plan
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleCategoryTasks(category.id, true)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleCategoryTasks(category.id, false)}
                        >
                          None
                        </Button>
                      </div>
                    </div>
                    
                    {/* Tasks grid */}
                    <div className="grid gap-3 md:grid-cols-2">
                      {categoryTasks.map(task => {
                        const config = getTaskConfig(task.id);
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                              config.active 
                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                                : 'hover:bg-accent/50'
                            }`}
                            onClick={() => updateTask(task.id, { active: !config.active })}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{task.name}</h4>
                                  {config.active && (
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.default_duration}min
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {t(`tasks.frequency.${task.frequency}`)}
                                  </Badge>
                                </div>
                                {task.helper_text && (
                                  <p className="text-xs text-muted-foreground mt-1 opacity-80">
                                    {task.helper_text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Advanced toggle */}
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm"
        >
          {showAdvanced ? 'Hide' : 'Show'} Maintenance & Seasonal Tasks
          <ChevronDownIcon 
            className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          />
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-accent/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{activeTasks.length}</div>
              <div className="text-xs text-muted-foreground">Active Tasks</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{Math.round(minutesPerAdult)}min</div>
              <div className="text-xs text-muted-foreground">Per Person/Week</div>
            </div>
            <div>
              <div className={`text-lg font-semibold ${
                fairnessScore > 100 ? 'text-red-500' : fairnessScore > 80 ? 'text-amber-500' : 'text-green-500'
              }`}>
                {fairnessScore}%
              </div>
              <div className="text-xs text-muted-foreground">Of Time Budget</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}