import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSetupDraft } from "@/hooks/use-setup-draft";
import { useMemo } from "react";
import { toast } from "@/hooks/use-toast";

const STEPS = [
  "Welkom",
  "Huishouden",
  "Tijd & voorkeuren",
  "Blokkades",
  "Taken kiezen",
  "Taken afstellen",
  "Adres & lokaal",
  "Samenvatting",
];

const useStep = () => {
  const params = useParams();
  const step = Math.max(1, Math.min(STEPS.length, Number(params.step) || 1));
  return step;
};

const StepIndicator = ({ step }: { step: number }) => (
  <nav aria-label="Wizard stappen" className="flex flex-wrap gap-2">
    {STEPS.map((label, i) => {
      const idx = i + 1;
      const active = idx === step;
      const done = idx < step;
      return (
        <span
          key={label}
          className={
            "px-3 py-1 rounded-full text-sm border " +
            (active
              ? "bg-primary/10 border-primary text-primary"
              : done
              ? "bg-muted text-foreground/80"
              : "bg-muted/50 text-muted-foreground")
          }
        >
          {idx}. {label}
        </span>
      );
    })}
  </nav>
);

export default function SetupFlow() {
  const step = useStep();
  const navigate = useNavigate();
  const { draft, setHousehold, addPerson, updatePerson, removePerson, adultsCount } = useSetupDraft();

  const title = useMemo(() => `Setup • ${STEPS[step - 1]}`, [step]);

  const go = (next: number) => navigate(`/setup/${Math.max(1, Math.min(STEPS.length, next))}`);

  const onNext = () => {
    // Per-step minimale validatie
    if (step === 2) {
      if (adultsCount < 1) {
        toast({ title: "Minimaal 1 volwassene", description: "Voeg ten minste één volwassene toe om door te gaan." });
        return;
      }
      if (!draft.household.name || draft.household.name.trim().length === 0) {
        toast({ title: "Huishoudnaam ontbreekt", description: "Vul een naam in voor je huishouden." });
        return;
      }
    }
    go(step + 1);
  };

  const onBack = () => go(step - 1);

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={`Setup stap ${step}: ${STEPS[step - 1]}`} />
        <link rel="canonical" href={`/setup/${step}`} />
      </Helmet>

      <section className="container py-8 space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Eerlijk weekplan — setup</h1>
          <StepIndicator step={step} />
        </header>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welkom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Eerlijk weekplan voor je huishouden — minder gedoe, minder discussie.
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Automatische verdeling op basis van tijd en voorkeuren</li>
                <li>Duidelijke herinneringen</li>
                <li>Nederlands & GDPR‑proof</li>
              </ul>
              <div className="flex gap-3">
                <Button onClick={() => go(2)}>Start nu zonder account</Button>
              </div>
              <p className="text-xs text-muted-foreground">We vragen alleen wat nodig is. Je data blijft lokaal op dit apparaat tijdens het testen.</p>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Huishouden (personen & rollen)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="hh-name">Naam huishouden</Label>
                <Input
                  id="hh-name"
                  value={draft.household.name}
                  onChange={(e) => setHousehold({ name: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                {draft.people.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Voornaam</Label>
                      <Input
                        value={p.first_name}
                        onChange={(e) => updatePerson(p.id, { first_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <select
                        className="h-10 w-full rounded-md border bg-background"
                        value={p.role}
                        onChange={(e) => updatePerson(p.id, { role: e.target.value as any })}
                      >
                        <option value="adult">Volwassene</option>
                        <option value="child">Kind</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>E‑mail (optioneel)</Label>
                      <Input
                        type="email"
                        value={p.email || ""}
                        onChange={(e) => updatePerson(p.id, { email: e.target.value })}
                        placeholder="naam@voorbeeld.nl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mobiel (optioneel)</Label>
                      <Input
                        type="tel"
                        value={p.phone || ""}
                        onChange={(e) => updatePerson(p.id, { phone: e.target.value })}
                        placeholder="+31 6 12 34 56 78"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Taal</Label>
                      <select
                        className="h-10 w-full rounded-md border bg-background"
                        value={p.locale}
                        onChange={(e) => updatePerson(p.id, { locale: e.target.value as any })}
                      >
                        <option value="nl">Nederlands</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`consent-${p.id}`}
                        checked={!!p.notify_opt_in}
                        onCheckedChange={(v) => updatePerson(p.id, { notify_opt_in: Boolean(v) })}
                      />
                      <Label htmlFor={`consent-${p.id}`}>Mag notificaties sturen (GDPR‑toestemming)</Label>
                    </div>

                    <div className="sm:col-span-2 flex gap-3">
                      <Button variant="secondary" onClick={() => updatePerson(p.id, { role: p.role })} disabled>
                        Opslaan
                      </Button>
                      <Button variant="destructive" onClick={() => removePerson(p.id)}>
                        Verwijder
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => addPerson("adult")}>+ Volwassene</Button>
                  <Button variant="secondary" onClick={() => addPerson("child")}>+ Kind</Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack} disabled={false}>
                  Terug
                </Button>
                <Button onClick={onNext}>Volgende</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step >= 3 && step <= 8 && (
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Deze stap is nog in opbouw voor lokale tests. Navigatie en conceptopslag werken al.
              </p>
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  Terug
                </Button>
                <Button onClick={onNext} disabled={step === 8}>
                  Volgende
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
