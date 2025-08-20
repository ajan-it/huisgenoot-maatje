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
import { splitByPerson, transformOccurrencesToAssignments } from "@/lib/analytics/planStats";
import type { Occurrence, Task, Person } from "@/types/models";

interface MyTasksPageProps {}

const MyTasks: React.FC<MyTasksPageProps> = () => {
  const { t, lang } = useI18n();
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  useEffect(() => {
    // Load data from localStorage (same structure as PlanView)
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setPlan(parsed);
      setTasks(parsed.tasks || []);
      setPeople(parsed.people || []);
      setOccurrences(parsed.assignments || []);
    } catch (error) {
      console.error("Error loading plan:", error);
    }
  }, []);

  // Get current user (first person for now)
  const currentUser = people[0];
  const currentUserId = currentUser?.id;

  // Filter tasks for current user  
  const myOccurrences = useMemo(() => {
    console.log('Filtering occurrences:', { occurrences, currentUserId });
    return occurrences.filter(occ => 
      occ.assigned_person === currentUserId && 
      occ.status === 'scheduled'
    );
  }, [occurrences, currentUserId]);

  // Get today's tasks
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = myOccurrences.filter(occ => occ.date === today);

  // Get this week's tasks
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const weekTasks = myOccurrences.filter(occ => {
    const taskDate = new Date(occ.date);
    return taskDate >= startOfWeek && taskDate <= endOfWeek;
  });

  // Calculate daily progress
  const todayMinutes = todayTasks.reduce((sum, occ) => {
    const task = tasks.find(t => t.id === occ.task_id);
    return sum + (task?.default_duration || 0);
  }, 0);

  const completedToday = todayTasks.filter(occ => occ.status === 'done').length;
  const progressPercent = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  // Partner peek data
  const partner = people.find(p => p.id !== currentUserId);
  const partnerTodayTasks = partner ? occurrences.filter(occ => 
    occ.assigned_person === partner.id && 
    occ.date === today && 
    occ.status === 'scheduled'
  ) : [];
  
  const partnerMinutes = partnerTodayTasks.reduce((sum, occ) => {
    const task = tasks.find(t => t.id === occ.task_id);
    return sum + (task?.default_duration || 0);
  }, 0);

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

  const handleTaskComplete = (occurrenceId: string) => {
    const updatedOccurrences = occurrences.map(occ =>
      occ.id === occurrenceId ? { ...occ, status: 'done' as const } : occ
    );
    setOccurrences(updatedOccurrences);
    localStorage.setItem("occurrences", JSON.stringify(updatedOccurrences));
    
    toast({
      title: "Task completed! 🎉",
      description: "Great job getting that done."
    });

    if (activeTask === occurrenceId) {
      setActiveTask(null);
      setFocusMode(false);
      setTimer(0);
    }
  };

  const handleTaskSnooze = (occurrenceId: string, snoozeType: '+30min' | 'tonight' | 'tomorrow') => {
    // Implementation would depend on your snooze logic
    toast({
      title: "Task snoozed",
      description: `Task moved to ${snoozeType}`
    });
  };

  const handleTaskSwap = (occurrenceId: string) => {
    toast({
      title: "Swap request sent",
      description: "Your partner will receive a notification"
    });
  };

  const handleExportICS = () => {
    // Create ICS content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Fair Household Planner
BEGIN:VEVENT
SUMMARY:My Tasks Today
DESCRIPTION:${todayTasks.length} tasks, ${todayMinutes} minutes
DTSTART:${today.replace(/-/g, '')}T080000
DTEND:${today.replace(/-/g, '')}T200000
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

  const TaskCard = ({ occurrence, task }: { occurrence: Occurrence; task: Task }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-card-foreground">{task.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{task.default_duration} min</span>
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={() => handleTaskComplete(occurrence.id)}
                className="h-8 px-2 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {lang === 'nl' ? 'Klaar' : 'Done'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTaskSnooze(occurrence.id, '+30min')}
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
                onClick={() => handleTaskSwap(occurrence.id)}
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
        
        {activeTask === occurrence.id && focusMode && (
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

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No plan found</h1>
          <p className="text-muted-foreground mb-4">Create a plan first to see your tasks.</p>
          <Button onClick={() => window.location.href = '/setup/1'}>
            Start Wizard
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
                {currentUser?.first_name}: {todayMinutes} min • {todayTasks.length} {lang === 'nl' ? 'taken' : 'tasks'}
              </span>
              <div className="w-8 h-8">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {partner && (
              <Badge variant="secondary" className="cursor-pointer">
                <User className="h-3 w-3 mr-1" />
                {partner.first_name}: {partnerMinutes} min • {partnerTodayTasks.length} {lang === 'nl' ? 'taken' : 'tasks'}
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
              todayTasks.map(occ => {
                const task = tasks.find(t => t.id === occ.task_id);
                return task ? <TaskCard key={occ.id} occurrence={occ} task={task} /> : null;
              })
            )}
          </TabsContent>
          
          <TabsContent value="week" className="space-y-4">
            {weekTasks.length === 0 ? (
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
              weekTasks.map(occ => {
                const task = tasks.find(t => t.id === occ.task_id);
                return task ? <TaskCard key={occ.id} occurrence={occ} task={task} /> : null;
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          <Button onClick={() => window.location.href = `/plan/${plan.plan_id}`}>
            {lang === 'nl' ? 'Bekijk Volledig Plan' : 'View Full Plan'}
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