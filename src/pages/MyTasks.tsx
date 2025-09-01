import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, User, Timer, CheckCircle, Calendar, RotateCcw, MessageCircle, HelpCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, isToday, isThisWeek } from "date-fns";

interface MyTasksPageProps {}

const MyTasks: React.FC<MyTasksPageProps> = () => {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [focusMode, setFocusMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  // Get current household and user
  const { data: householdData } = useQuery({
    queryKey: ['current-household-and-user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (memberError) throw memberError;
      
      // Get household people
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('household_id', memberData.household_id);
      
      if (peopleError) throw peopleError;
      
      // For now, assume first person is current user (this could be improved with user-person mapping)
      const currentPerson = people[0];
      
      return {
        householdId: memberData.household_id,
        people,
        currentPerson,
        userId: session.user.id
      };
    },
  });

  // Get current week's occurrences and tasks
  const { data: tasksData = [], isLoading } = useQuery({
    queryKey: ['my-tasks', householdData?.householdId, householdData?.currentPerson?.id],
    queryFn: async () => {
      if (!householdData?.householdId || !householdData?.currentPerson?.id) return [];

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const { data: occurrences, error } = await supabase
        .from('occurrences')
        .select(`
          *,
          tasks!inner(id, name, category, default_duration, difficulty),
          plans!inner(household_id)
        `)
        .eq('plans.household_id', householdData.householdId)
        .eq('assigned_person', householdData.currentPerson.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return occurrences || [];
    },
    enabled: !!householdData?.householdId && !!householdData?.currentPerson?.id,
  });

  // Filter tasks for today and this week
  const todayTasks = useMemo(() => {
    return tasksData.filter(task => isToday(new Date(task.date)));
  }, [tasksData]);

  const thisWeekTasks = useMemo(() => {
    return tasksData.filter(task => isThisWeek(new Date(task.date), { weekStartsOn: 1 }));
  }, [tasksData]);

  // Calculate progress
  const todayMinutes = todayTasks.reduce((sum, task) => sum + (task.duration_min || 0), 0);
  const completedToday = todayTasks.filter(task => task.status === 'done').length;
  const progressPercent = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  // Partner data
  const partner = householdData?.people.find(p => p.id !== householdData?.currentPerson?.id);
  const { data: partnerTasks = [] } = useQuery({
    queryKey: ['partner-tasks-today', householdData?.householdId, partner?.id],
    queryFn: async () => {
      if (!householdData?.householdId || !partner?.id) return [];

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: occurrences, error } = await supabase
        .from('occurrences')
        .select(`
          *,
          tasks!inner(default_duration),
          plans!inner(household_id)
        `)
        .eq('plans.household_id', householdData.householdId)
        .eq('assigned_person', partner.id)
        .eq('date', today);

      if (error) throw error;
      return occurrences || [];
    },
    enabled: !!householdData?.householdId && !!partner?.id,
  });

  const partnerMinutes = partnerTasks.reduce((sum, task) => sum + (task.duration_min || 0), 0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusMode && activeTask) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusMode, activeTask]);

  const handleTaskComplete = async (occurrenceId: string) => {
    try {
      const { error } = await supabase
        .from('occurrences')
        .update({ status: 'done' })
        .eq('id', occurrenceId);

      if (error) throw error;

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      
      toast({
        title: "Task completed! 🎉",
        description: "Great job getting that done."
      });

      if (activeTask === occurrenceId) {
        setActiveTask(null);
        setFocusMode(false);
        setTimer(0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleTaskSnooze = async (occurrenceId: string, snoozeType: '+30min' | 'tonight' | 'tomorrow') => {
    try {
      // This would require more complex logic to update the date/time
      toast({
        title: "Task snoozed",
        description: `Task moved to ${snoozeType}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to snooze task",
        variant: "destructive"
      });
    }
  };

  const handleTaskSwap = (occurrenceId: string) => {
    toast({
      title: "Swap request sent",
      description: "Your partner will receive a notification"
    });
  };

  const handleExportICS = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    // Create ICS content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Fair Household Planner
BEGIN:VEVENT
SUMMARY:My Tasks Today
DESCRIPTION:${todayTasks.length} tasks, ${todayMinutes} minutes
DTSTART:${todayStr.replace(/-/g, '')}T080000
DTEND:${todayStr.replace(/-/g, '')}T200000
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-tasks.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-card-foreground">{task.tasks?.name || 'Unknown Task'}</h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{task.duration_min || task.tasks?.default_duration || 0} min</span>
              <Badge variant="outline" className="text-xs">
                {task.tasks?.category || 'general'}
              </Badge>
              {task.start_time && (
                <span>{task.start_time.slice(0, 5)}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={() => handleTaskComplete(task.id)}
                className="h-8 px-2 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {lang === 'nl' ? 'Klaar' : 'Done'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTaskSnooze(task.id, '+30min')}
                className="h-8 px-2 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {lang === 'nl' ? 'Later' : 'Later'}
              </Button>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTaskSwap(task.id)}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {lang === 'nl' ? 'Ruil' : 'Swap'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                {lang === 'nl' ? 'Waarom ik?' : 'Why me?'}
              </Button>
            </div>
          </div>
        </div>
        
        {activeTask === task.id && focusMode && (
          <div className="mt-3 p-3 bg-accent rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Focus mode active</span>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="text-sm font-mono">{formatTime(timer)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (!householdData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in to view your tasks.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{lang === 'nl' ? 'Mijn Taken' : 'My Tasks'} | Fair Household Planner</title>
        <meta name="description" content="Your daily and weekly task overview" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{lang === 'nl' ? 'Mijn Taken' : 'My Tasks'}</h1>
            <Button variant="outline" onClick={handleExportICS}>
              <Calendar className="h-4 w-4 mr-2" />
              {lang === 'nl' ? 'Agenda' : 'Calendar'}
            </Button>
          </div>

          {/* Today summary */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {householdData.currentPerson?.first_name}: {todayMinutes} min • {todayTasks.length} {lang === 'nl' ? 'taken' : 'tasks'}
              </span>
              <div className="w-8 h-8">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {partner && (
              <Badge variant="secondary" className="cursor-pointer">
                <User className="h-3 w-3 mr-1" />
                {partner?.first_name}: {partnerMinutes} min • {partnerTasks.length} {lang === 'nl' ? 'taken' : 'tasks'}
              </Badge>
            )}
          </div>
        </div>

        {/* Focus mode toggle */}
        {!focusMode && todayTasks.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={() => {
                setFocusMode(true);
                setActiveTask(todayTasks[0]?.id);
                setTimer(0);
              }}
              className="w-full"
            >
              <Timer className="h-4 w-4 mr-2" />
              {lang === 'nl' ? 'Start Focus Mode' : 'Start Focus Mode'}
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">{lang === 'nl' ? 'Vandaag' : 'Today'}</TabsTrigger>
            <TabsTrigger value="week">{lang === 'nl' ? 'Deze week' : 'This week'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-4">
            {todayTasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">{lang === 'nl' ? 'Geen taken vandaag!' : 'No tasks today!'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'nl' ? 'Geniet van je vrije dag.' : 'Enjoy your free day.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              todayTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="week" className="space-y-4">
            {thisWeekTasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">{lang === 'nl' ? 'Geen taken deze week!' : 'No tasks this week!'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'nl' ? 'Tijd voor een nieuwe planning.' : 'Time for a new plan.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              thisWeekTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          <Button onClick={() => window.location.href = '/calendar/year'}>
            {lang === 'nl' ? 'Bekijk Kalender' : 'View Calendar'}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/compare'}>
            {lang === 'nl' ? 'Vergelijk Dashboard' : 'Compare Dashboard'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default MyTasks;