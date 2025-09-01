import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CalendarPlus, Loader2, Sparkles } from "lucide-react";
import { useYearPlanGeneration } from '@/hooks/useYearPlanGeneration';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface YearPlanGeneratorProps {
  year: number;
  householdId?: string;
  onPlanGenerated: () => void;
}

interface TaskTemplate {
  id: string;
  name: string;
  category: string;
  frequency: string;
  default_duration: number;
  difficulty: number;
  tags: string[];
  seasonal_months?: number[];
}

export function YearPlanGenerator({ year, householdId, onPlanGenerated }: YearPlanGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { generateYearPlan, isGenerating } = useYearPlanGeneration();

  // Fetch task templates
  const { data: taskTemplates = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_template', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as TaskTemplate[];
    },
  });

  // Fetch household people
  const { data: people = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['household-people', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      
      const { data, error } = await supabase
        .from('people')
        .select('id, weekly_time_budget, disliked_tasks, no_go_tasks')
        .eq('household_id', householdId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!householdId,
  });

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleGeneratePlan = async () => {
    if (!householdId || selectedTasks.length === 0) return;

    try {
      await generateYearPlan({
        household_id: householdId,
        year,
        selected_tasks: selectedTasks,
        people: people || [],
      });
      
      setIsOpen(false);
      onPlanGenerated();
    } catch (error) {
      console.error('Failed to generate year plan:', error);
    }
  };

  const groupedTasks = taskTemplates.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  const frequencyColors: Record<string, string> = {
    daily: 'bg-red-500',
    weekly: 'bg-orange-500',
    monthly: 'bg-blue-500',
    seasonal: 'bg-emerald-500',
    quarterly: 'bg-purple-500',
    semiannual: 'bg-indigo-500',
    annual: 'bg-slate-500'
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4" />
          Genereer {year} plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Jaarplan genereren voor {year}
          </DialogTitle>
          <DialogDescription>
            Selecteer de taken die je wilt opnemen in je jaarplan. Het systeem zal deze automatisch 
            verdelen over het hele jaar op basis van hun frequentie en seizoensgebondenheid.
          </DialogDescription>
        </DialogHeader>

        {(tasksLoading || peopleLoading) ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Laden van taken...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([category, tasks]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                  <CardDescription>
                    {tasks.length} beschikbare taken
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          id={task.id}
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <label 
                              htmlFor={task.id}
                              className="font-medium cursor-pointer"
                            >
                              {task.name}
                            </label>
                            <Badge 
                              variant="secondary" 
                              className="flex items-center gap-1"
                            >
                              <div 
                                className={`w-2 h-2 rounded-full ${frequencyColors[task.frequency] || 'bg-gray-500'}`} 
                              />
                              {task.frequency}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.default_duration} min • Moeilijkheid {task.difficulty}/3
                            {task.seasonal_months && (
                              <span className="ml-2">
                                • Seizoen: {task.seasonal_months.map(m => 
                                  new Date(2024, m-1).toLocaleDateString('nl', { month: 'short' })
                                ).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedTasks.length} taken geselecteerd
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={selectedTasks.length === 0 || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Plan genereren
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}