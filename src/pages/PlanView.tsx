import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

const PlanView = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const L = lang === "en";

  return (
    <main className="container py-8 space-y-4">
      <Helmet>
        <title>{L ? `Week plan | ${planId}` : `Weekplan | ${planId}`}</title>
        <meta name="description" content={L ? "View the generated weekly plan." : "Bekijk het gegenereerde weekplan."} />
        <link rel="canonical" href={`/plan/${planId}`} />
      </Helmet>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{L ? "Week plan" : "Weekplan"}</h1>
        <p className="text-muted-foreground">{L ? "Plan ID" : "Plan-ID"}: {planId}</p>
      </header>

      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">{L ? "This page is coming soon. For now you can return to start or run the wizard again." : "Deze pagina komt binnenkort. Voor nu kun je terug naar de start of de wizard opnieuw doorlopen."}</p>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/")}>{L ? "Back to start" : "Terug naar start"}</Button>
          <Button variant="secondary" onClick={() => navigate("/setup/1")}>{L ? "Open wizard" : "Wizard openen"}</Button>
        </div>
      </section>
    </main>
  );
};

export default PlanView;
