import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Leaf, 
  Sun, 
  TreePine, 
  Snowflake,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nProvider";

interface SeasonalTask {
  id: string;
  name: string;
  category: string;
  seasonal_months: number[];
  default_duration: number;
  difficulty: number;
  status?: 'scheduled' | 'done' | 'moved' | 'backlog';
  date?: string;
}

const seasonConfig = {
  spring: {
    icon: Leaf,
    label: 'Lente',
    months: [3, 4, 5],
    color: 'bg-emerald-500',
    description: 'Voorjaar taken'
  },
  summer: {
    icon: Sun,
    label: 'Zomer',
    months: [6, 7, 8],
    color: 'bg-amber-500',
    description: 'Zomer taken'
  },
  autumn: {
    icon: TreePine,
    label: 'Herfst',
    months: [9, 10, 11],
    color: 'bg-orange-500',
    description: 'Herfst taken'
  },
  winter: {
    icon: Snowflake,
    label: 'Winter',
    months: [12, 1, 2],
    color: 'bg-blue-500',
    description: 'Winter taken'
  },
};

const SeasonalDashboard = () => {
  const { t } = useI18n();
  const [selectedYear] = useState(new Date().getFullYear());

  // Get household ID
  const { data: householdId } = useQuery({
    queryKey: ['current-household'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) throw error;
      return data?.household_id;
    },
  });

  // Get seasonal tasks and occurrences
  const { data: seasonalData = [], isLoading } = useQuery({
    queryKey: ['seasonal-tasks', householdId, selectedYear],
    queryFn: async () => {
      if (!householdId) return [];

      // Get seasonal task templates
      const { data: seasonalTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('frequency', 'seasonal')
        .eq('is_template', false)
        .eq('household_id', householdId);

      if (tasksError) throw tasksError;

      // Get seasonal occurrences for this year
      const { data: occurrences, error: occError } = await supabase
        .from('occurrences')
        .select(`
          *,
          plans!inner(household_id),
          tasks!inner(name, category, seasonal_months, default_duration, difficulty)
        `)
        .eq('plans.household_id', householdId)
        .eq('frequency_source', 'seasonal')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      if (occError) throw occError;

      return occurrences || [];
    },
    enabled: !!householdId,
  });

  // Group tasks by season
  const tasksBySeason = useMemo(() => {
    const grouped: Record<string, SeasonalTask[]> = {
      spring: [],
      summer: [],
      autumn: [],
      winter: [],
    };

    seasonalData.forEach((occ: any) => {
      const task = occ.tasks;
      if (!task?.seasonal_months) return;

      const seasonalTask: SeasonalTask = {
        id: occ.id,
        name: task.name,
        category: task.category,
        seasonal_months: task.seasonal_months,
        default_duration: task.default_duration,
        difficulty: task.difficulty,
        status: occ.status,
        date: occ.date,
      };

      // Determine which season(s) this task belongs to
      task.seasonal_months.forEach((month: number) => {
        Object.entries(seasonConfig).forEach(([season, config]) => {
          if (config.months.includes(month)) {
            grouped[season].push(seasonalTask);
          }
        });
      });
    });

    return grouped;
  }, [seasonalData]);

  const getSeasonProgress = (tasks: SeasonalTask[]) => {
    if (tasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = tasks.filter(task => task.status === 'done').length;
    const total = tasks.length;
    const percentage = (completed / total) * 100;
    
    return { completed, total, percentage };
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  const currentSeason = getCurrentSeason();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Laden van seizoenstaken...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seizoens Dashboard</h1>
          <p className="text-muted-foreground">
            Overzicht van jouw seizoensgebonden taken voor {selectedYear}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          {React.createElement(seasonConfig[currentSeason].icon, { className: "h-4 w-4" })}
          Huidige seizoen: {seasonConfig[currentSeason].label}
        </Badge>
      </div>

      {/* Season Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(seasonConfig).map(([season, config]) => {
          const tasks = tasksBySeason[season] || [];
          const progress = getSeasonProgress(tasks);
          const Icon = config.icon;
          const isCurrentSeason = season === currentSeason;

          return (
            <Card key={season} className={`relative ${isCurrentSeason ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {config.months.map(m => 
                          new Date(2024, m-1).toLocaleDateString('nl', { month: 'short' })
                        ).join(', ')}
                      </CardDescription>
                    </div>
                  </div>
                  {isCurrentSeason && (
                    <Badge variant="secondary" className="text-xs">
                      Actief
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {progress.total} taken
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {progress.completed} klaar
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Voortgang</span>
                    <span>{Math.round(progress.percentage)}%</span>
                  </div>
                  <Progress 
                    value={progress.percentage} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-1">
                  {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{task.name}</span>
                      <Badge 
                        variant={task.status === 'done' ? 'default' : 'secondary'}
                        className="ml-2 text-xs"
                      >
                        {task.status === 'done' ? '✓' : '○'}
                      </Badge>
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{tasks.length - 3} meer...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Season Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(seasonConfig[currentSeason].icon, { className: "h-5 w-5" })}
            {seasonConfig[currentSeason].label} Taken Detail
          </CardTitle>
          <CardDescription>
            Gedetailleerd overzicht van taken voor het huidige seizoen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksBySeason[currentSeason]?.length > 0 ? (
            <div className="grid gap-4">
              {tasksBySeason[currentSeason].map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{task.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.default_duration} min
                      </span>
                      <span>Moeilijkheid: {task.difficulty}/3</span>
                      {task.date && (
                        <span>Gepland: {new Date(task.date).toLocaleDateString('nl')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={task.status === 'done' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {task.status === 'done' ? 'Klaar' : 'Te doen'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TreePine className="h-12 w-12 mx-auto mb-3" />
              <p>Geen seizoenstaken gepland voor {seasonConfig[currentSeason].label.toLowerCase()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeasonalDashboard;