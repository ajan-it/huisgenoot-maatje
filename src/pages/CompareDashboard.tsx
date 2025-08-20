import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, AlertCircle, RotateCcw, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  splitByPerson, 
  transformOccurrencesToAssignments, 
  calculateTargetSplit,
  generateSwapSuggestions,
  type PersonStats
} from "@/lib/analytics/planStats";
import type { Occurrence, Task, Person } from "@/types/models";

const CompareDashboard: React.FC = () => {
  const { t, lang } = useI18n();
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

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

  const stats = useMemo(() => {
    if (!occurrences.length || !tasks.length) return new Map();
    const assignments = transformOccurrencesToAssignments(occurrences, tasks);
    return splitByPerson(assignments);
  }, [occurrences, tasks]);

  const targetSplit = useMemo(() => 
    calculateTargetSplit(people), [people]
  );

  const fairnessScore = plan?.fairness_score || 71;
  
  const backlogTasks = occurrences.filter(occ => occ.status === 'backlog');

  // Calculate actual split
  const totalPoints = Array.from(stats.values()).reduce((sum, s) => sum + s.pts, 0);
  const actualSplit = new Map();
  stats.forEach((stat, personId) => {
    actualSplit.set(personId, totalPoints > 0 ? stat.pts / totalPoints : 0);
  });

  // Workload chart data
  const workloadData = people.filter(p => p.role === 'adult').map(person => {
    const personStats = stats.get(person.id);
    const target = targetSplit[person.id] * totalPoints;
    const actual = personStats?.pts || 0;

    return {
      name: person.first_name,
      target: Math.round(target),
      actual: actual,
      targetPercent: Math.round((targetSplit[person.id] || 0) * 100),
      actualPercent: Math.round((actualSplit.get(person.id) || 0) * 100)
    };
  });

  // Hard/Medium/Light chart data
  const difficultyData = people.filter(p => p.role === 'adult').map(person => {
    const personStats = stats.get(person.id);
    return {
      name: person.first_name,
      hard: personStats?.hard || 0,
      medium: personStats?.med || 0,
      light: personStats?.light || 0
    };
  });

  // Category distribution data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    
    stats.forEach(personStats => {
      Object.entries(personStats.cats).forEach(([cat, points]) => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (points as number);
      });
    });

    return Object.entries(categoryTotals).map(([category, points]) => ({
      name: category,
      value: points,
      percentage: Math.round((points / totalPoints) * 100)
    }));
  }, [stats, totalPoints]);

  // Evening heat map data
  const eveningData = people.filter(p => p.role === 'adult').map(person => {
    const personStats = stats.get(person.id);
    const evenings = personStats?.evenings || [0, 0, 0, 0, 0];
    
    return {
      name: person.first_name,
      Monday: evenings[0] || 0,
      Tuesday: evenings[1] || 0,
      Wednesday: evenings[2] || 0,
      Thursday: evenings[3] || 0,
      Friday: evenings[4] || 0
    };
  });

  // Generate swap suggestions
  const swapSuggestions = useMemo(() => {
    if (!occurrences.length || !tasks.length) return [];
    const assignments = transformOccurrencesToAssignments(occurrences, tasks);
    return generateSwapSuggestions(assignments, people, fairnessScore);
  }, [occurrences, tasks, people, fairnessScore]);

  const handleApplySwap = (suggestion: any) => {
    toast({
      title: "Swap applied! ✨",
      description: `${suggestion.description} - Fairness improved by +${suggestion.fairnessGain}`
    });
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No plan found</h1>
          <p className="text-muted-foreground mb-4">Create a plan first to compare fairness.</p>
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
        <title>{lang === 'nl' ? 'Vergelijking' : 'Compare'} | Fair Household Planner</title>
        <meta name="description" content="Compare workload distribution and fairness" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">{lang === 'nl' ? 'Verdeling Vergelijken' : 'Compare Distribution'}</h1>
          
          {/* Summary row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-sm">
              <span className="font-medium">
                {lang === 'nl' ? 'Doel vs. werkelijk:' : 'Target vs. actual:'}
              </span>
              {workloadData.map((data, idx) => (
                <span key={data.name} className="ml-2">
                  {data.name}: {data.targetPercent}% → {data.actualPercent}%
                  {idx < workloadData.length - 1 ? ' | ' : ''}
                </span>
              ))}
            </div>
            
            <Badge variant={fairnessScore >= 80 ? "default" : fairnessScore >= 60 ? "secondary" : "destructive"}>
              {lang === 'nl' ? 'Weekscore' : 'Week score'}: {fairnessScore}/100
            </Badge>
            
            {backlogTasks.length > 0 && (
              <Badge variant="outline">
                <AlertCircle className="h-3 w-3 mr-1" />
                {backlogTasks.length} {lang === 'nl' ? 'taken backlog' : 'tasks backlog'}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Workload vs Target Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {lang === 'nl' ? 'Werkbelasting vs Doel' : 'Workload vs Target'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="target" fill="hsl(var(--muted))" name={lang === 'nl' ? 'Doel' : 'Target'} />
                  <Bar dataKey="actual" fill="hsl(var(--primary))" name={lang === 'nl' ? 'Werkelijk' : 'Actual'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hard/Medium/Light Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'nl' ? 'Moeilijkheidsgraad Mix' : 'Difficulty Mix'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={difficultyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="light" stackId="a" fill="hsl(120 60% 70%)" name={lang === 'nl' ? 'Licht' : 'Light'} />
                  <Bar dataKey="medium" stackId="a" fill="hsl(60 60% 70%)" name={lang === 'nl' ? 'Gemiddeld' : 'Medium'} />
                  <Bar dataKey="hard" stackId="a" fill="hsl(0 60% 70%)" name={lang === 'nl' ? 'Zwaar' : 'Hard'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evening Load Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'nl' ? 'Avondbelasting (Ma-Vr)' : 'Evening Load (Mon-Fri)'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eveningData.map(person => (
                  <div key={person.name} className="space-y-2">
                    <div className="text-sm font-medium">{person.name}</div>
                    <div className="grid grid-cols-5 gap-1">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                        const load = person[day as keyof typeof person] as number;
                        const intensity = Math.min(load / 50, 1); // Scale to 0-1
                        return (
                          <div
                            key={day}
                            className="h-8 rounded text-xs flex items-center justify-center text-white font-medium"
                            style={{ 
                              backgroundColor: `hsl(${120 - intensity * 120} 60% ${50 + intensity * 20}%)` 
                            }}
                          >
                            {load}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'nl' ? 'Categorie Verdeling' : 'Category Distribution'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Disliked Tasks Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{lang === 'nl' ? 'Niet-leuk Taken' : 'Disliked Tasks'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {people.filter(p => p.role === 'adult').map(person => {
                const personStats = stats.get(person.id);
                return (
                  <div key={person.id} className="flex items-center justify-between">
                    <span className="font-medium">{person.first_name}</span>
                    <Badge variant="outline">
                      {personStats?.disliked || 0} {lang === 'nl' ? 'punten' : 'points'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Make it Fairer Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {lang === 'nl' ? 'Eerlijker Maken' : 'Make it Fairer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {swapSuggestions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {lang === 'nl' 
                    ? 'Voorgestelde verbeteringen die de fairness verhogen:' 
                    : 'Suggested improvements that increase fairness:'
                  }
                </p>
                
                {swapSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.description}</div>
                      <div className="text-sm text-muted-foreground">
                        +{suggestion.fairnessGain} {lang === 'nl' ? 'fairness punten' : 'fairness points'}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleApplySwap(suggestion)}
                      className="ml-4"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {lang === 'nl' ? 'Toepassen' : 'Apply'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">
                  {lang === 'nl' ? 'Verdeling ziet er goed uit!' : 'Distribution looks good!'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'nl' 
                    ? 'Geen verbeteringen nodig op dit moment.' 
                    : 'No improvements needed right now.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          <Button onClick={() => window.location.href = `/plan/${plan.plan_id}`}>
            {lang === 'nl' ? 'Bekijk Volledig Plan' : 'View Full Plan'}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/my'}>
            {lang === 'nl' ? 'Mijn Taken' : 'My Tasks'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default CompareDashboard;