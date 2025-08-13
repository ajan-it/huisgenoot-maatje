import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import PlanSchedule from "@/components/PlanSchedule";

const PlanView = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { lang } = useI18n();
  const L = lang === "en";

  const [plan, setPlan] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.plan_id === planId) setPlan(parsed);
    } catch {}
  }, [planId]);

  const title = useMemo(() => (L ? `Week plan | ${planId}` : `Weekplan | ${planId}`), [L, planId]);

  return (
    <main className="container py-8 space-y-6">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={L ? "View the generated weekly plan." : "Bekijk het gegenereerde weekplan."} />
        <link rel="canonical" href={`/plan/${planId}`} />
      </Helmet>

      {params.get("invite") === "1" && (
        <Alert>
          <AlertTitle>{L ? "You were invited" : "Je bent uitgenodigd"}</AlertTitle>
          <AlertDescription>
            {L ? "This is a shared week plan link. You can review the plan below." : "Dit is een gedeelde weekplan‑link. Hieronder kun je het plan bekijken."}
          </AlertDescription>
        </Alert>
      )}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{L ? "Week plan" : "Weekplan"}</h1>
        <p className="text-muted-foreground">{L ? "Plan ID" : "Plan-ID"}: {planId}</p>
      </header>

      {plan ? (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {L ? "Overview" : "Overzicht"}
                <Badge variant="secondary">{L ? "Fairness" : "Eerlijkheid"}: {plan.fairness ?? 0}/100</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="font-medium text-foreground">{plan.occurrences ?? 0}</div>
                  <div className="text-xs">{L ? "Tasks" : "Taken"}</div>
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
            <div>
              <h2 className="text-xl font-semibold mb-4">{L ? "Weekly Schedule" : "Weekplanning"}</h2>
              <PlanSchedule 
                assignments={plan.assignments} 
                people={plan.people || []} 
                weekStart={plan.week_start} 
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/")}>{L ? "Back to start" : "Terug naar start"}</Button>
            <Button variant="secondary" onClick={() => navigate("/setup/1")}>{L ? "Run wizard again" : "Wizard opnieuw"}</Button>
          </div>
        </section>
      ) : (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>{L ? "Plan not found" : "Plan niet gevonden"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                {L
                  ? "We couldn't find this plan on this device. Create a new plan with the wizard."
                  : "We konden dit plan niet vinden op dit apparaat. Maak een nieuw plan via de wizard."}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/setup/1")}>{L ? "Start wizard" : "Start wizard"}</Button>
                <Button variant="secondary" onClick={() => navigate("/")}>{L ? "Back to start" : "Terug naar start"}</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
};

export default PlanView;
