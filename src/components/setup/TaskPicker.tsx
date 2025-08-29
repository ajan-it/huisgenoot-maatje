import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InfoIcon, FilterIcon, PackageIcon } from "lucide-react";
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

const FREQUENCY_ORDER: Frequency[] = [
  "daily", "two_per_week", "three_per_week", "weekly", 
  "biweekly", "monthly", "quarterly", "semiannual", "annual", "seasonal", "custom"
];

const CONTEXT_FILTERS = [
  "apartment", "house", "garden", "fireplace", "cycling", "car", "solar", "pets"
];

const TASK_PACKS = [
  "pack_no_kids", "pack_toddler", "pack_schoolkids", "pack_two_workers",
  "pack_house_garden", "pack_apartment", "pack_appliance_maint", "pack_safety_checks",
  "pack_season_spring", "pack_season_autumn"
];

export function TaskPicker({ selectedTasks, onTasksChange, adultsCount, totalMinutesBudget }: TaskPickerProps) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedFrequencies, setSelectedFrequencies] = useState<Frequency[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const filteredTasks = useMemo(() => {
    let tasks = SEED_TASKS.filter(task => {
      // Search filter
      if (search && !task.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Frequency filter
      if (selectedFrequencies.length > 0 && !selectedFrequencies.includes(task.frequency)) {
        return false;
      }
      
      // Context filter
      if (selectedContexts.length > 0) {
        const hasMatchingContext = selectedContexts.some(context => {
          switch (context) {
            case "apartment":
              return task.location === "indoor" && !task.tags?.includes("garden");
            case "house":
              return !task.tags?.includes("apartment");
            case "garden":
              return task.tags?.includes("garden") || task.location === "outdoor";
            case "cycling":
              return task.tags?.includes("cycling");
            case "car":
              return task.tags?.includes("car");
            case "fireplace":
              return task.tags?.includes("fireplace") || task.name.includes("haard");
            case "solar":
              return task.tags?.includes("solar") || task.name.includes("zonnepanelen");
            case "pets":
              return task.tags?.includes("pets");
            default:
              return true;
          }
        });
        if (!hasMatchingContext) return false;
      }
      
      // Category filter
      if (visibleCategories.length > 0 && !visibleCategories.includes(task.category)) {
        return false;
      }
      
      return true;
    });
    
    // Sort by frequency, then by name
    return tasks.sort((a, b) => {
      const freqA = FREQUENCY_ORDER.indexOf(a.frequency);
      const freqB = FREQUENCY_ORDER.indexOf(b.frequency);
      if (freqA !== freqB) return freqA - freqB;
      return a.name.localeCompare(b.name);
    });
  }, [search, selectedFrequencies, selectedContexts, visibleCategories]);

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

  const applyPack = (packId: string) => {
    const packTasks = SEED_TASKS.filter(task => task.packs?.includes(packId));
    const newTasks = [...selectedTasks];
    
    packTasks.forEach(task => {
      const index = newTasks.findIndex(t => t.id === task.id);
      const config = {
        id: task.id,
        active: true,
        frequency: task.frequency,
        duration: task.default_duration,
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
  };

  const activeTasks = selectedTasks.filter(t => t.active);
  const estimatedMinutesPerWeek = activeTasks.reduce((sum, task) => {
    const seedTask = SEED_TASKS.find(t => t.id === task.id);
    if (!seedTask) return sum;
    
    const duration = task.duration || seedTask.default_duration;
    const frequency = task.frequency || seedTask.frequency;
    
    // Convert frequency to weekly minutes
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

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t("tasks.picker.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <FilterIcon className="h-4 w-4 mr-2" />
                {t("tasks.picker.filters")}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t("tasks.picker.filters")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium">{t("tasks.picker.filterFrequency")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {FREQUENCY_ORDER.map(freq => (
                        <Badge
                          key={freq}
                          variant={selectedFrequencies.includes(freq) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedFrequencies(prev => 
                              prev.includes(freq) 
                                ? prev.filter(f => f !== freq)
                                : [...prev, freq]
                            );
                          }}
                        >
                          {t(`tasks.frequency.${freq}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                
                  <div>
                    <Label className="text-sm font-medium">{t("tasks.picker.filterContext")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CONTEXT_FILTERS.map(context => (
                        <Badge
                          key={context}
                          variant={selectedContexts.includes(context) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedContexts(prev => 
                              prev.includes(context) 
                                ? prev.filter(c => c !== context)
                                : [...prev, context]
                            );
                          }}
                        >
                          {t(`tasks.context.${context}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Recommended packs */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            <PackageIcon className="h-4 w-4 inline mr-1" />
            {t("tasks.picker.recommendedPacks")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {TASK_PACKS.map(pack => (
              <Button
                key={pack}
                variant="outline"
                size="sm"
                onClick={() => applyPack(pack)}
              >
                {t(`tasks.packs.${pack}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Task grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map(task => {
          const config = getTaskConfig(task.id);
          
          return (
            <Card key={task.id} className={`transition-all ${config.active ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm">{task.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className="text-xs">
                         {t(`tasks.${task.category}`)}
                       </Badge>
                       <Badge variant="secondary" className="text-xs">
                         {t(`tasks.frequency.${config.frequency || task.frequency}`)}
                       </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={config.active}
                    onCheckedChange={(active) => updateTask(task.id, { active })}
                  />
                </div>
              </CardHeader>
              
              {config.active && (
                 <CardContent className="pt-0 space-y-3">
                   <div>
                     <Label className="text-xs">{t("tasks.picker.frequency")}</Label>
                     <Select
                       value={config.frequency || task.frequency}
                       onValueChange={(frequency: Frequency) => updateTask(task.id, { frequency })}
                     >
                       <SelectTrigger className="h-8">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="daily">{t("tasks.frequency.daily")}</SelectItem>
                         <SelectItem value="two_per_week">{t("tasks.frequency.two_per_week")}</SelectItem>
                         <SelectItem value="three_per_week">{t("tasks.frequency.three_per_week")}</SelectItem>
                         <SelectItem value="weekly">{t("tasks.frequency.weekly")}</SelectItem>
                         <SelectItem value="biweekly">{t("tasks.frequency.biweekly")}</SelectItem>
                         <SelectItem value="monthly">{t("tasks.frequency.monthly")}</SelectItem>
                         <SelectItem value="quarterly">{t("tasks.frequency.quarterly")}</SelectItem>
                         <SelectItem value="semiannual">{t("tasks.frequency.semiannual")}</SelectItem>
                         <SelectItem value="annual">{t("tasks.frequency.annual")}</SelectItem>
                         <SelectItem value="seasonal">{t("tasks.frequency.seasonal")}</SelectItem>
                         <SelectItem value="custom">{t("tasks.frequency.custom")}</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div>
                     <Label className="text-xs">{t("tasks.picker.duration")}: {config.duration || task.default_duration} min</Label>
                     <Slider
                       value={[config.duration || task.default_duration]}
                       onValueChange={([duration]) => updateTask(task.id, { duration })}
                       min={5}
                       max={120}
                       step={5}
                       className="mt-1"
                     />
                   </div>
                   
                   <div className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                       <Checkbox
                         id={`weekend-${task.id}`}
                         checked={config.weekend_only || false}
                         onCheckedChange={(weekend_only) => updateTask(task.id, { weekend_only: Boolean(weekend_only) })}
                       />
                       <Label htmlFor={`weekend-${task.id}`}>{t("tasks.picker.weekendOnly")}</Label>
                     </div>
                     <div className="flex items-center gap-2">
                       <Checkbox
                         id={`avoid-${task.id}`}
                         checked={config.avoid_evenings || false}
                         onCheckedChange={(avoid_evenings) => updateTask(task.id, { avoid_evenings: Boolean(avoid_evenings) })}
                       />
                       <Label htmlFor={`avoid-${task.id}`}>{t("tasks.picker.avoidEvenings")}</Label>
                     </div>
                   </div>
                  
                  {task.helper_text && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{task.helper_text}</span>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{activeTasks.length}</div>
              <div className="text-sm text-muted-foreground">{t("tasks.picker.activeTasks")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(minutesPerAdult)}
                <span className="text-lg text-muted-foreground ml-1">
                  ({(minutesPerAdult / 60).toFixed(1)}h)
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t("tasks.picker.estimatedMinutes")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ≈ {(minutesPerAdult / 60).toFixed(1)}h per week • {minutesPerAdult < 90 ? t("tasks.picker.timeLight") : 
                        minutesPerAdult < 150 ? t("tasks.picker.timeNormal") : 
                        t("tasks.picker.timeBusy")}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{fairnessScore}%</div>
              <div className="text-sm text-muted-foreground">{t("tasks.picker.fairnessPreview")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}