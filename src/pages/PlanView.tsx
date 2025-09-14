import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import PlanSchedule from "@/components/PlanSchedule";
import { FairnessBadge } from "@/components/plan/FairnessBadge";
import { EnhancedFairnessDrawer } from "@/components/plan/EnhancedFairnessDrawer";
import { RebalancePreview } from "@/components/RebalancePreview";
import { WeeklyReflectionBanner } from "@/components/reflection/WeeklyReflectionBanner";
import { DisruptionForm } from "@/components/reflection/DisruptionForm";
import { TaskQuickActions } from "@/components/calendar/TaskQuickActions";
import type { FairnessDetails } from "@/types/plan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDisruptions } from "@/hooks/useDisruptions";
import { Loader2, Sparkles, Settings, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { resolveRealContext } from "@/lib/resolve-real-context";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useAuth } from "@/contexts/AuthContext";

const PlanView = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { lang } = useI18n();
  const { session } = useAuth();
  const L = lang === "en";

  const [isRebalancing, setIsRebalancing] = useState(false);
  const [showRebalancePreview, setShowRebalancePreview] = useState(false);
  const [rebalanceData, setRebalanceData] = useState<any>(null);
  const [fairnessDrawerOpen, setFairnessDrawerOpen] = useState(false);
  const [fairnessDetails, setFairnessDetails] = useState<FairnessDetails | null>(null);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const { toast } = useToast();
  
  // Resolve real context - detect demo vs real mode
  const realContext = useMemo(() => {
    return resolveRealContext({
      session,
      route: { planId },
      local: { lastPlanResponse: localStorage.getItem('lastPlanResponse') }
    });
  }, [session, planId]);

  if (import.meta.env.DEV) {
    console.log('🔍 PlanView context:', realContext);
  }

  // Parse plan parameters from route
  const [parsedHouseholdId, parsedWeekStart] = useMemo(() => {
    if (!planId || realContext.isDemo) return [null, null];
    const match = planId.match(/^([0-9a-fA-F-]{36})-(\d{4}-\d{2}-\d{2})$/);
    if (!match) return [null, null];
    return [match[1], match[2]];
  }, [planId, realContext.isDemo]);

  // Get real household if authenticated
  const { data: householdId } = useQuery({
    queryKey: ['current-household', realContext.userId],
    queryFn: async () => {
      if (realContext.isDemo || !realContext.userId) return null;
      
      const { data: memberships, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', realContext.userId);
      
      if (error || !memberships?.length) return null;
      return memberships[0].household_id;
    },
    enabled: !realContext.isDemo && !!realContext.userId,
  });

  // Redirect authenticated users from demo routes to real routes
  useEffect(() => {
    if (!realContext.isDemo && realContext.userId && planId?.startsWith('HH_LOCAL-') && householdId) {
      const weekStart = planId.split('-').slice(1).join('-'); // Get date part
      const realPlanId = `${householdId}-${weekStart}`;
      
      if (import.meta.env.DEV) {
        console.log('🔄 Redirecting from demo route to real route:', { from: planId, to: realPlanId });
      }
      
      // Clear demo data
      localStorage.removeItem('lastPlanResponse');
      
      navigate(`/plan/${realPlanId}`, { replace: true });
      return;
    }
  }, [realContext, planId, householdId, navigate]);

  // A. Week View - Single source of truth with React Query
  const { data: plan, isLoading: planLoading, error: planError, refetch: refetchPlan } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      if (realContext.isDemo) {
        // Demo mode: only use localStorage
        const raw = localStorage.getItem("lastPlanResponse");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.plan_id === planId ? parsed : null;
      }

      // Real mode: fetch from database only
      if (!parsedHouseholdId || !parsedWeekStart) return null;

      console.debug('[plan] querying', { householdId: parsedHouseholdId, weekStart: parsedWeekStart });
      
      const { data: planData, error: pErr } = await supabase
        .from('plans')
        .select('id, household_id, week_start, fairness_score, status')
        .eq('household_id', parsedHouseholdId)
        .eq('week_start', parsedWeekStart)
        .maybeSingle();

      if (pErr || !planData) {
        console.warn('[plan] plan not found', { pErr, householdId: parsedHouseholdId, weekStart: parsedWeekStart });
        return null;
      }

      return {
        plan_id: planData.id,
        household_id: planData.household_id,
        week_start: planData.week_start,
        fairness: planData.fairness_score || 0,
      };
    },
    enabled: !!planId && (realContext.isDemo || (!!parsedHouseholdId && !!parsedWeekStart)),
    staleTime: 30000, // 30 seconds
  });

  // B. Occurrences with plan-scoped cache key
  const { data: occurrences = [], isLoading: occurrencesLoading, refetch: refetchOccurrences } = useQuery({
    queryKey: ['occurrences', planId],
    queryFn: async () => {
      if (realContext.isDemo || !plan?.plan_id) return [];

      const { data: occurrences, error: occError } = await supabase
        .from('occurrences')
        .select(`
          id, date, task_id, assigned_person, status, start_time, 
          duration_min, difficulty_weight, is_critical, reminder_level,
          rationale
        `)
        .eq('plan_id', plan.plan_id)
        .order('date', { ascending: true });

      if (occError) {
        console.error('Error fetching occurrences:', occError);
        throw occError;
      }

      return occurrences || [];
    },
    enabled: !!plan?.plan_id && !realContext.isDemo,
    staleTime: 30000,
  });

  // C. People data
  const { data: people = [] } = useQuery({
    queryKey: ['people', parsedHouseholdId],
    queryFn: async () => {
      if (realContext.isDemo || !parsedHouseholdId) return [];

      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, first_name, role, weekly_time_budget')
        .eq('household_id', parsedHouseholdId);

      if (peopleError) {
        console.error('Error fetching people:', peopleError);
        throw peopleError;
      }

      return people || [];
    },
    enabled: !!parsedHouseholdId && !realContext.isDemo,
    staleTime: 60000,
  });

  // D. Tasks data for enrichment
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', occurrences],
    queryFn: async () => {
      if (realContext.isDemo || !occurrences.length) return [];

      const taskIds = [...new Set(occurrences.map(o => o.task_id))];
      if (!taskIds.length) return [];

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, category, tags')
        .in('id', taskIds);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw tasksError;
      }

      return tasks || [];
    },
    enabled: occurrences.length > 0 && !realContext.isDemo,
    staleTime: 300000, // 5 minutes
  });

  // Transform data for UI components - derive counts from fetched rows
  const enrichedPlan = useMemo(() => {
    if (!plan) return null;

    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const peopleMap = new Map(people.map(p => [p.id, p]));

    const assignments = occurrences.map(occ => {
      const task = taskMap.get(occ.task_id);
      const person = occ.assigned_person ? peopleMap.get(occ.assigned_person) : null;

      return {
        id: occ.id,
        task_id: occ.task_id,
        task_name: task?.name || occ.task_id,
        task_category: task?.category || 'unknown',
        task_tags: task?.tags || [],
        task_duration: occ.duration_min,
        task_difficulty: Math.round(occ.difficulty_weight || 1),
        date: occ.date,
        time_slot: {
          start: occ.start_time,
          end: occ.start_time // Will be calculated based on duration
        },
        assigned_person_id: occ.assigned_person,
        assigned_person_name: person?.first_name || 'Unassigned',
        status: occ.status,
        rationale: occ.rationale ? JSON.parse(String(occ.rationale)) : null
      };
    });

    return {
      ...plan,
      // B = occurrences.length, C = unique tasks
      occurrences: occurrences.length,
      unique_tasks: new Set(occurrences.map(o => o.task_id)).size,
      assignments,
      people,
      tasks
    };
  }, [plan, occurrences, tasks, people]);

  const effectiveHouseholdId = realContext.isDemo ? null : parsedHouseholdId;
  const { disruptions, createDisruptions } = useDisruptions(effectiveHouseholdId, plan?.week_start);

  const title = useMemo(() => (L ? `Week plan | ${planId}` : `Weekplan | ${planId}`), [L, planId]);

  const handleMakeItFairer = async () => {
    if (!enrichedPlan?.assignments || !enrichedPlan?.people || !enrichedPlan?.tasks) return;
    
    setIsRebalancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('plan-generate-with-overrides', {
        body: {
          household_id: planId?.split('-')[0] || 'HH_LOCAL',
          date_range: {
            start: enrichedPlan.week_start,
            end: new Date(new Date(enrichedPlan.week_start).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          context: 'week',
          mode: 'rebalance_soft',
          current_assignments: enrichedPlan.assignments
        }
      });

      if (error) throw error;

      if (data?.rebalance_preview) {
        setRebalanceData(data);
        setShowRebalancePreview(true);
      } else {
        toast({
          title: L ? "No improvements found" : "Geen verbeteringen gevonden",
          description: L ? "The current plan is already well-balanced." : "Het huidige plan is al goed uitgebalanceerd.",
        });
      }
    } catch (error) {
      console.error('Rebalance error:', error);
      toast({
        title: L ? "Failed to optimize" : "Optimalisatie mislukt",
        description: L ? "Something went wrong while trying to improve fairness." : "Er ging iets mis bij het verbeteren van de eerlijkheid.",
        variant: "destructive"
      });
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleApplyRebalance = async () => {
    if (!rebalanceData) return;
    
    // Update localStorage with new plan data for demo mode
    if (realContext.isDemo) {
      localStorage.setItem("lastPlanResponse", JSON.stringify(rebalanceData));
    }
    
    // Update fairness details if available
    if (rebalanceData?.fairness_details) {
      setFairnessDetails(rebalanceData.fairness_details);
    }
    
    // Show success message
    const improvement = rebalanceData.rebalance_preview.projectedFairness - rebalanceData.rebalance_preview.currentFairness;
    toast({
      title: L ? "Plan optimized!" : "Plan geoptimaliseerd!",
      description: L ? `Fairness improved by ${improvement} points.` : `Eerlijkheid verbeterd met ${improvement} punten.`,
    });
    
    // Close preview and refetch data
    setShowRebalancePreview(false);
    setRebalanceData(null);
    
    // Refetch to get updated data
    refetchPlan();
    refetchOccurrences();
  };

  const handleReflectionSubmit = async (disruptionsData: any[]) => {
    const success = await createDisruptions(disruptionsData);
    if (success) {
      setShowReflectionForm(false);
      toast({
        title: L ? "Reflection saved" : "Reflectie opgeslagen",
        description: L ? "Your insights will help improve next week's plan" : "Je inzichten helpen het plan van volgende week te verbeteren"
      });
    }
  };

  const handleRefresh = () => {
    refetchPlan();
    refetchOccurrences();
  };

  const isLoading = planLoading || occurrencesLoading;

  if (isLoading) {
    return (
      <main className="container py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  if (planError) {
    return (
      <main className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>{L ? "Error loading plan" : "Fout bij laden plan"}</AlertTitle>
          <AlertDescription>
            {planError.message || (L ? "Failed to load plan data" : "Kan plangegevens niet laden")}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container py-8 space-y-6">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={L ? "View the generated weekly plan." : "Bekijk het gegenereerde weekplan."} />
        <link rel="canonical" href={`/plan/${planId}`} />
      </Helmet>

      {realContext.isDemo && <DemoBanner className="mb-6" />}

      {params.get("invite") === "1" && (
        <Alert>
          <AlertTitle>{L ? "You were invited" : "Je bent uitgenodigd"}</AlertTitle>
          <AlertDescription>
            {L ? "This is a shared week plan link. You can review the plan below." : "Dit is een gedeelde weekplan‑link. Hieronder kun je het plan bekijken."}
          </AlertDescription>
        </Alert>
      )}

      {/* Weekly Reflection Banner */}
      {enrichedPlan && (
        <WeeklyReflectionBanner
          weekStart={enrichedPlan.week_start}
          onStartReflection={() => setShowReflectionForm(true)}
          hasReflection={disruptions.length > 0}
        />
      )}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{L ? "Week plan" : "Weekplan"}</h1>
        <p className="text-muted-foreground">{L ? "Plan ID" : "Plan-ID"}: {planId}</p>
      </header>

      {enrichedPlan ? (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{L ? "Overview" : "Overzicht"}</span>
                <div className="flex items-center gap-2">
                  {effectiveHouseholdId && enrichedPlan?.week_start && !realContext.isDemo && (
                    <TaskQuickActions
                      householdId={effectiveHouseholdId}
                      date={new Date(enrichedPlan.week_start)}
                      onTaskUpdate={handleRefresh}
                      planId={enrichedPlan.plan_id}
                    />
                  )}
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2">
                    <FairnessBadge 
                      score={enrichedPlan.fairness ?? 0}
                      onClick={() => setFairnessDrawerOpen(true)}
                    />
                   
                   {(enrichedPlan.fairness ?? 0) < 85 && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleMakeItFairer}
                       disabled={isRebalancing}
                       className="h-7 px-3 text-xs border-primary/20 hover:bg-primary/5"
                     >
                       {isRebalancing ? (
                         <>
                           <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                           {L ? "Optimizing..." : "Optimaliseren..."}
                         </>
                       ) : (
                         <>
                           <Sparkles className="h-3 w-3 mr-1" />
                           {L ? "Make it Fairer" : "Maak Eerlijker"}
                         </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{enrichedPlan.occurrences}</div>
                  <div className="text-xs">{L ? "Occurrences" : "Uitvoeringen"}</div>
                  <div className="text-xs text-muted-foreground">
                    {enrichedPlan.unique_tasks} {L ? "unique tasks" : "unieke taken"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{enrichedPlan.fairness ?? 0}/100</div>
                  <div className="text-xs">{L ? "Fairness" : "Eerlijkheid"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{enrichedPlan.people?.length ?? 0}</div>
                  <div className="text-xs">{L ? "People" : "Personen"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {new Date(enrichedPlan.week_start).toLocaleDateString(L ? "en-GB" : "nl-NL", { day: "numeric", month: "short" })}
                  </div>
                  <div className="text-xs">{L ? "Week start" : "Week start"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {enrichedPlan.assignments && enrichedPlan.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{L ? "Weekly Schedule" : "Weekplanning"}</span>
                   {effectiveHouseholdId && !realContext.isDemo && (
                     <Button variant="outline" size="sm">
                       <Settings className="h-4 w-4 mr-2" />
                       {L ? "Manage Tasks" : "Taken Beheren"}
                     </Button>
                   )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlanSchedule 
                  assignments={enrichedPlan.assignments} 
                  people={enrichedPlan.people || []} 
                  weekStart={enrichedPlan.week_start} 
                  planId={enrichedPlan.plan_id}
                />
              </CardContent>
            </Card>
          )}

           <div className="flex flex-wrap gap-2">
            {realContext.isDemo && (
              <Badge variant="secondary">{L ? "Demo Mode" : "Demo Modus"}</Badge>
            )}
            <Badge variant="outline">{L ? "Generated Plan" : "Gegenereerd Plan"}</Badge>
           </div>
        </section>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <h2 className="text-xl font-semibold">{L ? "Plan not found" : "Plan niet gevonden"}</h2>
            <p className="text-muted-foreground">
              {L ? "This plan doesn't exist or you don't have access to it." : "Dit plan bestaat niet of je hebt er geen toegang toe."}
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => navigate('/')} variant="outline">
                {L ? "Back to Home" : "Terug naar Home"}
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {L ? "Reload" : "Opnieuw laden"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals and Drawers */}
      <EnhancedFairnessDrawer
        open={fairnessDrawerOpen}
        onClose={() => setFairnessDrawerOpen(false)}
        score={enrichedPlan?.fairness ?? 0}
        details={fairnessDetails}
        peopleById={people.reduce((acc, p) => ({ ...acc, [p.id]: { first_name: p.first_name } }), {})}
        assignments={enrichedPlan?.assignments || []}
        weekStart={enrichedPlan?.week_start}
      />

      <Dialog open={showRebalancePreview} onOpenChange={setShowRebalancePreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <RebalancePreview
            open={showRebalancePreview}
            onOpenChange={setShowRebalancePreview}
            currentFairness={rebalanceData?.rebalance_preview?.currentFairness || 0}
            projectedFairness={rebalanceData?.rebalance_preview?.projectedFairness || 0}
            changes={rebalanceData?.rebalance_preview?.changes || []}
            adults={people.map(p => ({
              id: p.id,
              name: p.first_name,
              currentMinutes: 0,
              projectedMinutes: 0,
              targetMinutes: p.weekly_time_budget || 0
            }))}
            onApply={handleApplyRebalance}
            onCancel={() => setShowRebalancePreview(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showReflectionForm} onOpenChange={setShowReflectionForm}>
        <DialogContent className="max-w-2xl">
          <DisruptionForm
            weekStart={enrichedPlan?.week_start || ''}
            people={people}
            onSubmit={handleReflectionSubmit}
            onCancel={() => setShowReflectionForm(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PlanView;