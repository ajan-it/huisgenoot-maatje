import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PlanView = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  return (
    <main className="container py-8 space-y-4">
      <Helmet>
        <title>Weekplan | {planId}</title>
        <meta name="description" content="Bekijk het gegenereerde weekplan." />
        <link rel="canonical" href={`/plan/${planId}`} />
      </Helmet>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Weekplan</h1>
        <p className="text-muted-foreground">Plan-ID: {planId}</p>
      </header>

      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">Deze pagina komt binnenkort. Voor nu kun je terug naar de start of de wizard opnieuw doorlopen.</p>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/")}>Terug naar start</Button>
          <Button variant="secondary" onClick={() => navigate("/setup/1")}>Wizard openen</Button>
        </div>
      </section>
    </main>
  );
};

export default PlanView;
