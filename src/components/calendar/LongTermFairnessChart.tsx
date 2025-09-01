import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Clock, Calendar } from "lucide-react";

interface FairnessMetrics {
  personId: string;
  personName: string;
  totalMinutes: number;
  totalPoints: number;
  weeklyBudget: number;
  yearlyBudget: number;
  fairnessPercentage: number;
  reliabilityScore: number;
  completedTasks: number;
  totalTasks: number;
}

interface LongTermFairnessChartProps {
  metrics: FairnessMetrics[];
  year: number;
}

export function LongTermFairnessChart({ metrics, year }: LongTermFairnessChartProps) {
  const overallStats = useMemo(() => {
    const totalMinutes = metrics.reduce((sum, m) => sum + m.totalMinutes, 0);
    const totalTasks = metrics.reduce((sum, m) => sum + m.totalTasks, 0);
    const completedTasks = metrics.reduce((sum, m) => sum + m.completedTasks, 0);
    const avgReliability = metrics.reduce((sum, m) => sum + m.reliabilityScore, 0) / metrics.length;
    
    return {
      totalMinutes,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      avgReliability
    };
  }, [metrics]);

  const getFairnessColor = (percentage: number) => {
    if (percentage >= 45 && percentage <= 55) return 'text-emerald-600';
    if (percentage >= 35 && percentage <= 65) return 'text-amber-600';
    return 'text-red-600';
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{Math.round(overallStats.totalMinutes / 60)}h</p>
                <p className="text-xs text-muted-foreground">Totale tijd {year}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{overallStats.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Totale taken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{Math.round(overallStats.completionRate)}%</p>
                <p className="text-xs text-muted-foreground">Afgerond</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{Math.round(overallStats.avgReliability)}%</p>
                <p className="text-xs text-muted-foreground">Gem. betrouwbaarheid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Person-by-Person Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Jaarlijkse Eerlijkheidsverdeling
          </CardTitle>
          <CardDescription>
            Vergelijking van de werklastverdeling over {year}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {metrics.map((person) => (
            <div key={person.personId} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{person.personName}</h4>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getFairnessColor(person.fairnessPercentage)}
                  >
                    {Math.round(person.fairnessPercentage)}% werklast
                  </Badge>
                  <Badge 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <div 
                      className={`w-2 h-2 rounded-full ${getReliabilityColor(person.reliabilityScore)}`}
                    />
                    {Math.round(person.reliabilityScore)}% betrouwbaar
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">
                    {Math.round(person.totalMinutes / 60)}h 
                  </span>
                  <span className="ml-1">van {Math.round(person.yearlyBudget / 60)}h budget</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {person.completedTasks}
                  </span>
                  <span className="ml-1">van {person.totalTasks} taken</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {Math.round(person.totalPoints)}
                  </span>
                  <span className="ml-1">punten</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tijdsbesteding</span>
                  <span>{Math.round((person.totalMinutes / person.yearlyBudget) * 100)}%</span>
                </div>
                <Progress 
                  value={(person.totalMinutes / person.yearlyBudget) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Voltooiingspercentage</span>
                  <span>{Math.round((person.completedTasks / Math.max(person.totalTasks, 1)) * 100)}%</span>
                </div>
                <Progress 
                  value={(person.completedTasks / Math.max(person.totalTasks, 1)) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}