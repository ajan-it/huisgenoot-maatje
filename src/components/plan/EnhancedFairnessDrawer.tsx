import React, { useState, useMemo } from "react";
import { X, Sparkles, RotateCcw, HelpCircle } from "lucide-react";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch as UISwitch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/I18nProvider";
import { FairnessBars } from "./FairnessBars";
import { EffortBreakdown } from "./EffortBreakdown";
import { TaskTypeBreakdown } from "./TaskTypeBreakdown";
import { HardEasyBreakdown } from "./HardEasyBreakdown";
import { FairnessTrend } from "./FairnessTrend";
import type { FairnessDetails } from "@/types/plan";
import { formatDisruptionExplanation } from "@/lib/fairness-enhanced";
import { useDisruptions } from "@/hooks/useDisruptions";
import {
  buildTypeBreakdown,
  buildDifficultyCounts,
  getMandatoryFlexibleCounts,
  getTrendHistory,
  saveTrendPoint,
  type PersonSplit,
  type Assignment
} from "@/lib/fairness-helpers";

interface EnhancedFairnessDrawerProps {
  open: boolean;
  onClose: () => void;
  score: number;
  details: FairnessDetails | null;
  peopleById: Record<string, { first_name: string }>;
  assignments?: Assignment[];
  weekStart?: string;
  onMakeFairer?: () => void;
  onSuggestSwap?: () => void;
}

export function EnhancedFairnessDrawer({
  open,
  onClose,
  score,
  details,
  peopleById,
  assignments = [],
  weekStart,
  onMakeFairer,
  onSuggestSwap
}: EnhancedFairnessDrawerProps) {
  const { lang } = useI18n();
  const L = lang === "en";
  
  // Get dictionary based on language
  const dict = L ? {
    title: "Fairness Analysis",
    subtitle: "We balance workload points (minutes × difficulty) based on your time budgets and avoid evening overload.",
    badge: { good: "Well balanced", okay: "Could be better", poor: "Not fairly split" },
    distribution: { 
      title: "Distribution per person",
      note: "We calculate fairness by comparing each person's actual workload points vs their target share."
    },
    effort: {
      title: "Effort breakdown",
      note: "Not all minutes are equal. We weigh tasks by difficulty (minutes × difficulty). Harder tasks count more towards fairness."
    },
    taskTypes: { 
      title: "Task types",
      note: "How workload points are distributed across different household categories."
    },
    mandatoryFlexible: { 
      title: "Mandatory vs Flexible", 
      note: "Mandatory tasks (bedtime, pickups, meals) stay fixed. Flexible tasks can be swapped for fairness." 
    },
    hardEasy: { 
      title: "Difficulty breakdown",
      note: "Hard tasks (≥40 pts) are typically longer or more stressful, while medium and easy tasks weigh less."
    },
    whyNot100: { 
      title: "Why not 100?",
      note: "Evening overload = 2+ evening tasks or >40min. Stacking = 3+ tasks back-to-back or >60min."
    },
    quickActions: { makeFairer: "Make it fairer", suggestSwap: "Suggest swap" },
    trend: { title: "Trend (last 4 weeks)" },
    myWeek: "My week",
    tooltips: {
      fairnessScore: "We calculate fairness by comparing each person's actual workload points vs their target share.",
      difficulty: "Effort points = minutes × difficulty weight. Hard = ≥40 pts, Medium = 20–39 pts, Easy <20 pts.",
      violations: "Evening overload = 2+ evening tasks or >40min. Stacking = 3+ tasks back-to-back or >60min."
    }
  } : {
    title: "Eerlijkheidsanalyse",
    subtitle: "We verdelen werkdrukpunten (minuten × zwaarte) op basis van jullie tijdsbudgetten en vermijden avondpiek.",
    badge: { good: "Goed verdeeld", okay: "Kan beter", poor: "Niet eerlijk verdeeld" },
    distribution: { 
      title: "Verdeling per persoon",
      note: "We berekenen eerlijkheid door ieders werkelijke werkdruk te vergelijken met hun doelverdeling."
    },
    effort: {
      title: "Inspanningsverdeling",
      note: "Niet alle minuten zijn gelijk. We wegen taken op moeilijkheid (minuten × zwaarte). Zwaardere taken tellen meer mee voor eerlijkheid."
    },
    taskTypes: { 
      title: "Taaktypes",
      note: "Hoe werkdrukpunten verdeeld zijn over verschillende huishoudcategorieën."
    },
    mandatoryFlexible: { 
      title: "Verplicht vs Flexibel", 
      note: "Verplichte taken (avondritueel, halen/brengen) blijven vast. Flexibele taken kunnen geruild worden voor eerlijkheid." 
    },
    hardEasy: { 
      title: "Moeilijkheidsgraad",
      note: "Zware taken (≥40 punten) zijn meestal langer of stressvoller, lichte taken wegen minder zwaar."
    },
    whyNot100: { 
      title: "Waarom geen 100?",
      note: "Avondpiek = 2+ avondtaken of >40min. Stapeling = 3+ taken achter elkaar of >60min."
    },
    quickActions: { makeFairer: "Maak eerlijker", suggestSwap: "Stel ruil voor" },
    trend: { title: "Trend (laatste 4 weken)" },
    myWeek: "Mijn week",
    tooltips: {
      fairnessScore: "We berekenen eerlijkheid door ieders werkelijke werkdruk te vergelijken met hun doelverdeling.",
      difficulty: "Inspanningspunten = minuten × moeilijkheidsgewicht. Zwaar = ≥40 pts, Gemiddeld = 20–39 pts, Licht <20 pts.",
      violations: "Avondpiek = 2+ avondtaken of >40min. Stapeling = 3+ taken achter elkaar of >60min."
    }
  };
  const t = dict;
  
  const [myWeekMode, setMyWeekMode] = useState(false);
  
  // Save trend point when drawer opens
  React.useEffect(() => {
    if (open && weekStart && score) {
      saveTrendPoint(weekStart, score);
    }
  }, [open, weekStart, score]);
  
  // Transform fairness details to PersonSplit format
  const personSplits = useMemo<PersonSplit[]>(() => {
    if (!details?.adults) return [];
    
    return details.adults.map(adult => ({
      id: adult.person_id,
      name: peopleById[adult.person_id]?.first_name || adult.person_id,
      actualMinutes: adult.actual_minutes,
      actualPoints: adult.actual_points,
      targetMinutes: adult.target_minutes,
      targetPoints: adult.target_points,
      actualShare: adult.actual_share,
      targetShare: adult.target_share,
      deltaMinutes: adult.delta_minutes,
      eveningsOverCap: details.contributors.evenings_over_cap[adult.person_id] || 0,
      stackingViolations: details.contributors.stacking_violations[adult.person_id] || 0,
      dislikedAssignments: details.contributors.disliked_assignments[adult.person_id] || 0,
    }));
  }, [details, peopleById]);
  
  // Get task type breakdowns
  const taskBreakdowns = useMemo(() => {
    if (personSplits.length < 2) return null;
    
    const [personA, personB] = personSplits;
    return {
      aName: personA.name,
      bName: personB.name,
      a: buildTypeBreakdown(assignments, personA.id),
      b: buildTypeBreakdown(assignments, personB.id)
    };
  }, [personSplits, assignments]);
  
  // Get difficulty breakdowns
  const difficultyBreakdowns = useMemo(() => {
    if (personSplits.length < 2) return null;
    
    const [personA, personB] = personSplits;
    return {
      aName: personA.name,
      bName: personB.name,
      aCounts: buildDifficultyCounts(assignments, personA.id),
      bCounts: buildDifficultyCounts(assignments, personB.id)
    };
  }, [personSplits, assignments]);
  
  // Get mandatory/flexible counts
  const mandatoryFlexible = useMemo(() => {
    return getMandatoryFlexibleCounts(assignments);
  }, [assignments]);
  
  // Get trend data
  const trendData = useMemo(() => {
    return getTrendHistory();
  }, [open]); // Refresh when drawer opens
  
  // Get badge info
  const getBadgeInfo = (score: number) => {
    if (score >= 80) return { label: t.badge.good, color: "bg-green-100 text-green-800" };
    if (score >= 60) return { label: t.badge.okay, color: "bg-yellow-100 text-yellow-800" };
    return { label: t.badge.poor, color: "bg-red-100 text-red-800" };
  };
  
  const badgeInfo = getBadgeInfo(score);
  
  // Get "Why not 100?" contributors
  const getContributorItems = () => {
    if (!details?.contributors) return [];
    
    const items: { personName: string; issue: string; count: number }[] = [];
    
    Object.entries(details.contributors.evenings_over_cap).forEach(([pid, count]) => {
      if (count > 0) {
        const name = peopleById[pid]?.first_name || pid;
        const issue = L ? `${count} evening(s) over 40min` : `${count} avond(en) boven 40min`;
        items.push({ personName: name, issue, count });
      }
    });
    
    Object.entries(details.contributors.stacking_violations).forEach(([pid, count]) => {
      if (count > 0) {
        const name = peopleById[pid]?.first_name || pid;
        const issue = L ? `${count} stacking (3+ tasks or ≥60min)` : `${count} stapeling (3+ taken of ≥60min)`;
        items.push({ personName: name, issue, count });
      }
    });
    
    Object.entries(details.contributors.disliked_assignments).forEach(([pid, count]) => {
      if (count > 0) {
        const name = peopleById[pid]?.first_name || pid;
        const issue = L ? `${count} disliked assignment(s)` : `${count} taak/taken die minder leuk zijn`;
        items.push({ personName: name, issue, count });
      }
    });
    
    return items;
  };
  
  const contributorItems = getContributorItems();
  
  if (!open) return null;
  
  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-w-md mx-auto h-[90vh]">
        <DrawerHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DrawerTitle>{t.title}</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {t.subtitle}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t.myWeek}</span>
              <UISwitch 
                checked={myWeekMode} 
                onCheckedChange={setMyWeekMode}
              />
            </div>
          </div>
        </DrawerHeader>
        
        <TooltipProvider>
          <div className="flex-1 overflow-y-auto px-6 space-y-6">
            {/* Score Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-3xl font-bold">{score}/100</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{t.tooltips.fairnessScore}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge className={badgeInfo.color}>{badgeInfo.label}</Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Distribution per person */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{t.distribution.title}</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{t.tooltips.fairnessScore}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <FairnessBars people={personSplits} />
                <p className="text-xs text-muted-foreground">{t.distribution.note}</p>
              </CardContent>
            </Card>
            
            {/* Effort breakdown */}
            {taskBreakdowns && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.effort.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <EffortBreakdown {...taskBreakdowns} />
                  <p className="text-xs text-muted-foreground">{t.effort.note}</p>
                </CardContent>
              </Card>
            )}
          
            {/* Task type breakdown */}
            {taskBreakdowns && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.taskTypes.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <TaskTypeBreakdown {...taskBreakdowns} />
                  <p className="text-xs text-muted-foreground">{t.taskTypes.note}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Mandatory vs Flexible */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.mandatoryFlexible.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {L ? "Mandatory" : "Verplicht"}
                  </span>
                  <span className="font-medium">
                    {mandatoryFlexible.mandatory.tasks} {L ? "tasks" : "taken"} • {mandatoryFlexible.mandatory.points} {L ? "pts" : "punten"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {L ? "Flexible" : "Flexibel"}
                  </span>
                  <span className="font-medium">
                    {mandatoryFlexible.flexible.tasks} {L ? "tasks" : "taken"} • {mandatoryFlexible.flexible.points} {L ? "pts" : "punten"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t.mandatoryFlexible.note}</p>
              </CardContent>
            </Card>
            
            {/* Hard vs Easy breakdown */}
            {difficultyBreakdowns && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{t.hardEasy.title}</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{t.tooltips.difficulty}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <HardEasyBreakdown {...difficultyBreakdowns} />
                  <p className="text-xs text-muted-foreground">{t.hardEasy.note}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Why not 100? */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{t.whyNot100.title}</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{t.tooltips.violations}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contributorItems.length > 0 ? (
                  <div className="space-y-2">
                    {contributorItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>
                          <span className="font-medium">{item.personName}:</span> {item.issue}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {L 
                      ? "No specific bottlenecks found. Score may be affected by small workload differences."
                      : "Geen specifieke knelpunten gevonden. Score kan worden beïnvloed door kleine verschillen in werkdruk."
                    }
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t.whyNot100.note}</p>
              </CardContent>
            </Card>
            
            {/* Trend */}
            {trendData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.trend.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FairnessTrend points={trendData} />
                </CardContent>
              </Card>
            )}
            
            {/* Quick Actions - More Personalized */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {L ? "Quick improvements" : "Snelle verbeteringen"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {onMakeFairer && score < 85 && (
                    <Button 
                      onClick={onMakeFairer}
                      className="justify-start"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t.quickActions.makeFairer}
                    </Button>
                  )}
                  
                  {onSuggestSwap && (
                    <Button 
                      onClick={onSuggestSwap}
                      variant="outline"
                      className="justify-start"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t.quickActions.suggestSwap}
                    </Button>
                  )}
                </div>
                
                {/* Personalized suggestions based on actual data */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {personSplits.length >= 2 && (
                    <>
                      {personSplits[0].deltaMinutes > 15 && (
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span>
                            {L 
                              ? `Add +${Math.ceil(personSplits[0].deltaMinutes / 5) * 5} mins to ${personSplits[0].name}'s budget to balance workload`
                              : `Voeg +${Math.ceil(personSplits[0].deltaMinutes / 5) * 5} min toe aan ${personSplits[0].name}'s budget voor balans`
                            }
                          </span>
                        </div>
                      )}
                      {personSplits[1].deltaMinutes > 15 && (
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span>
                            {L 
                              ? `Add +${Math.ceil(personSplits[1].deltaMinutes / 5) * 5} mins to ${personSplits[1].name}'s budget to balance workload`
                              : `Voeg +${Math.ceil(personSplits[1].deltaMinutes / 5) * 5} min toe aan ${personSplits[1].name}'s budget voor balans`
                            }
                          </span>
                        </div>
                      )}
                      {personSplits.some(p => p.eveningsOverCap > 0) && (
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          <span>
                            {L 
                              ? "Swap an evening task to reduce overload"
                              : "Ruil een avondtaak om overbelasting te verminderen"
                            }
                          </span>
                        </div>
                      )}
                      {mandatoryFlexible.flexible.tasks > 5 && (
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span>
                            {L 
                              ? "Consider reducing frequency of your heaviest flexible task"
                              : "Overweeg de frequentie van je zwaarste flexibele taak te verlagen"
                            }
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>
        
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {L ? "Close" : "Sluiten"}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}