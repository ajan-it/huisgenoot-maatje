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
import { Loader2, Sparkles, Settings } from "lucide-react";
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

  const [plan, setPlan] = useState<any | null>(null);
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
  
  // Robust slug parser
  function parsePlanSlug(slug: string) {
    const m = slug.match(/^([0-9a-fA-F-]{36})-(\d{4}-\d{2}-\d{2})$/);
    if (!m) return null;
    return { householdId: m[1], weekStart: m[2] };
  }

  // Parse plan parameters
  const [parsedHouseholdId, parsedWeekStart] = useMemo(() => {
    if (!planId) return [null, null];
    const parsed = parsePlanSlug(planId);
    if (!parsed) return [null, null];
    return [parsed.householdId, parsed.weekStart];
  }, [planId]);

  const effectiveHouseholdId = realContext.isDemo ? null : householdId;
  const { disruptions, createDisruptions } = useDisruptions(effectiveHouseholdId, plan?.week_start);

  // Fetch plan from database for real users
  const fetchPlanFromDatabase = async () => {
    const parsed = parsePlanSlug(planId || '');
    if (!parsed) {
      setPlan(null);
      return;
    }

    const { householdId, weekStart } = parsed;

    if (session?.user) {
      console.debug('[week] querying', { householdId, weekStart });
      const { data: plan, error: pErr } = await supabase
        .from('plans')
        .select('id, household_id, week_start, fairness_score, status')
        .eq('household_id', householdId)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (pErr || !plan) {
        console.warn('[week] plan not found', { pErr, householdId, weekStart });
        setPlan(null);
        return;
      }

      // Fetch occurrences for this plan
      const { data: occurrences, error: occError } = await supabase
        .from('occurrences')
        .select(`
          id, date, task_id, assigned_person, status, start_time, 
          duration_min, difficulty_weight, is_critical, reminder_level,
          rationale
        `)
        .eq('plan_id', plan.id)
        .order('date', { ascending: true });

      if (occError) {
        console.error('Error fetching occurrences:', occError);
        return;
      }

      // Fetch people data
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, first_name, role, weekly_time_budget')
        .eq('household_id', householdId);

      if (peopleError) {
        console.error('Error fetching people:', peopleError);
        return;
      }

      // Fetch task templates to enrich occurrence data
      const taskIds = [...new Set(occurrences?.map(o => o.task_id) || [])];
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, category, tags')
        .in('id', taskIds);

      // Transform data to match expected format
      const taskMap = new Map(tasks?.map(t => [t.id, t]) || []);
      const peopleMap = new Map(people?.map(p => [p.id, p]) || []);

      const assignments = occurrences?.map(occ => {
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
      }) || [];

      const planObject = {
        plan_id: plan.id,
        household_id: plan.household_id,
        week_start: plan.week_start,
        fairness: plan.fairness_score || 0,
        occurrences: assignments.length,
        assignments,
        people: people || [],
        tasks: tasks || []
      };

      setPlan(planObject);
      
      if (import.meta.env.DEV) {
        console.log('✅ Plan loaded from database:', planObject);
      }
      return;
    }
    
    // guest flow fallback
    setPlan(null);
  };

  useEffect(() => {
    // Only load from localStorage in demo mode
    if (realContext.isDemo) {
      try {
        const raw = localStorage.getItem("lastPlanResponse");
        if (import.meta.env.DEV) {
          console.log("📦 Loading demo data from localStorage:", !!raw);
        }
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.plan_id === planId) {
          setPlan(parsed);
          if (parsed?.fairness_details) {
            setFairnessDetails(parsed.fairness_details);
          }
        }
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    } else {
      // In real mode, clear localStorage and fetch from Supabase
      if (import.meta.env.DEV) {
        console.log("🗑️ Real mode: clearing localStorage demo data");
      }
      localStorage.removeItem('lastPlanResponse');
      
      // Fetch real plan data from Supabase
      fetchPlanFromDatabase();
    }
  }, [planId, realContext.isDemo, session?.user]);

  const title = useMemo(() => (L ? `Week plan | ${planId}` : `Weekplan | ${planId}`), [L, planId]);

  const handleMakeItFairer = async () => {
    if (!plan?.assignments || !plan?.people || !plan?.tasks) return;
    
    setIsRebalancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('plan-generate-with-overrides', {
        body: {
          household_id: planId?.split('-')[0] || 'HH_LOCAL',
          date_range: {
            start: plan.week_start,
            end: new Date(new Date(plan.week_start).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          context: 'week',
          mode: 'rebalance_soft',
          current_assignments: plan.assignments
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
    
    // Update localStorage with new plan data
    localStorage.setItem("lastPlanResponse", JSON.stringify(rebalanceData));
    
    // Update the current plan state
    setPlan(rebalanceData);
    
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
    
    // Close preview
    setShowRebalancePreview(false);
    setRebalanceData(null);
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
      {plan && (
        <WeeklyReflectionBanner
          weekStart={plan.week_start}
          onStartReflection={() => setShowReflectionForm(true)}
          hasReflection={disruptions.length > 0}
        />
      )}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{L ? "Week plan" : "Weekplan"}</h1>
        <p className="text-muted-foreground">{L ? "Plan ID" : "Plan-ID"}: {planId}</p>
      </header>

      {plan ? (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{L ? "Overview" : "Overzicht"}</span>
                {effectiveHouseholdId && plan?.week_start && !realContext.isDemo && (
                  <TaskQuickActions
                    householdId={effectiveHouseholdId}
                    date={new Date(plan.week_start)}
                    onTaskUpdate={() => window.location.reload()}
                  />
                )}
              </CardTitle>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2">
                    <FairnessBadge 
                      score={plan.fairness ?? 0}
                      onClick={() => setFairnessDrawerOpen(true)}
                    />
                   
                   {(plan.fairness ?? 0) < 85 && (
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
                  <div className="font-medium text-foreground">{plan.assignments?.length ?? 0}</div>
                  <div className="text-xs">{L ? "Occurrences" : "Uitvoeringen"}</div>
                  {plan.assignments && (
                    <div className="text-xs text-muted-foreground">
                      {new Set(plan.assignments.map((a: any) => a.task_id)).size} {L ? "unique tasks" : "unieke taken"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">{plan.fairness ?? 0}/100</div>
                  <div className="text-xs">{L ? "Fairness" : "Eerlijkheid"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{plan.people?.length ?? 0}</div>
                  <div className="text-xs">{L ? "People" : "Personen"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {new Date(plan.week_start).toLocaleDateString(L ? "en-GB" : "nl-NL", { day: "numeric", month: "short" })}
                  </div>
                  <div className="text-xs">{L ? "Week start" : "Week start"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {plan.assignments && plan.assignments.length > 0 && (
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
                  assignments={plan.assignments} 
                  people={plan.people || []} 
                  weekStart={plan.week_start} 
                />
              </CardContent>
            </Card>
          )}

           <div className="flex flex-wrap gap-2">
             <Button onClick={() => navigate("/my")}>{L ? "My Tasks" : "Mijn Taken"}</Button>
             <Button variant="outline" onClick={() => navigate("/compare")}>{L ? "Compare" : "Vergelijk"}</Button>
             <Button variant="secondary" onClick={() => navigate("/")}>{L ? "Back to start" : "Terug naar start"}</Button>
           </div>
         </section>
       ) : (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>{L ? "Plan not found" : "Plan niet gevonden"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {L
                  ? "We couldn't find this plan on this device. You can create a new plan or manage tasks."
                  : "We konden dit plan niet vinden op dit apparaat. Je kunt een nieuw plan maken of taken beheren."}
              </p>
              
              {/* Quick access to task management */}
              {effectiveHouseholdId && !realContext.isDemo && (
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{L ? "Quick Task Management" : "Snel Taken Beheren"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {L ? "Add or remove tasks for this week" : "Taken toevoegen of verwijderen voor deze week"}
                        </p>
                      </div>
                      <TaskQuickActions
                        householdId={effectiveHouseholdId}
                        date={new Date(planId?.split('-')[1] || new Date().toISOString().split('T')[0])}
                        onTaskUpdate={() => window.location.reload()}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => navigate("/setup/1")}>{L ? "Start wizard" : "Start wizard"}</Button>
                <Button variant="outline" onClick={() => navigate("/calendar/week")}>{L ? "View Calendar" : "Bekijk Kalender"}</Button>
                <Button variant="secondary" onClick={() => navigate("/")}>{L ? "Back to start" : "Terug naar start"}</Button>
              </div>
            </CardContent>
          </Card>
         </section>
        )}

        {/* Enhanced Fairness Drawer */}
        <EnhancedFairnessDrawer
          open={fairnessDrawerOpen}
          onClose={() => setFairnessDrawerOpen(false)}
          score={plan?.fairness ?? 0}
          details={fairnessDetails}
          peopleById={Object.fromEntries((plan?.people || []).map((p: any) => [p.id, { first_name: p.first_name }]))}
          assignments={plan?.assignments || []}
          weekStart={plan?.week_start}
          onMakeFairer={handleMakeItFairer}
        />

        {/* Rebalance Preview Dialog */}
        {showRebalancePreview && rebalanceData?.rebalance_preview && (
          <RebalancePreview
            open={showRebalancePreview}
            onOpenChange={setShowRebalancePreview}
            currentFairness={rebalanceData.rebalance_preview.currentFairness}
            projectedFairness={rebalanceData.rebalance_preview.projectedFairness}
            changes={rebalanceData.rebalance_preview.changes}
            adults={rebalanceData.rebalance_preview.adults}
            onApply={handleApplyRebalance}
            onCancel={() => {
              setShowRebalancePreview(false);
              setRebalanceData(null);
            }}
          />
        )}

        {/* Reflection Form Dialog */}
        {showReflectionForm && plan && (
          <Dialog open={showReflectionForm} onOpenChange={setShowReflectionForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DisruptionForm
                weekStart={plan.week_start}
                people={plan.people || []}
                onSubmit={handleReflectionSubmit}
                onCancel={() => setShowReflectionForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
   );
 };

export default PlanView;
