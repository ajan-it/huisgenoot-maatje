import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SEED_TASKS, SEED_BLACKOUTS } from "@/data/seeds";
import { toast } from "@/hooks/use-toast";

const SetupWizard = () => {
  const [householdName, setHouseholdName] = useState("Ons huishouden");
  const [people, setPeople] = useState([
    { first_name: "Ouder 1", role: "adult", weekly_time_budget: 300, contact: "", disliked: [] as string[] },
    { first_name: "Ouder 2", role: "adult", weekly_time_budget: 300, contact: "", disliked: [] as string[] },
  ]);

  const toggleDisliked = (idx: number, taskName: string) => {
    setPeople((prev) => {
      const next = [...prev];
      const set = new Set(next[idx].disliked);
      set.has(taskName) ? set.delete(taskName) : set.add(taskName);
      next[idx].disliked = Array.from(set);
      return next;
    });
  };

  const addPerson = () => setPeople((p) => [...p, { first_name: "Kind", role: "child", weekly_time_budget: 60, contact: "", disliked: [] }]);

  const saveAndContinue = () => {
    console.log("WIZARD_SNAPSHOT", { householdName, people });
    toast({ title: "Voorlopig opgeslagen", description: "Je kunt later altijd aanpassen." });
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Setup wizard – Eerlijke huishoudplanner</title>
        <meta name="description" content="Stel je huishouden in: bewoners, tijdsbudgetten, voorkeuren en blokkades. Nederlands als standaard." />
        <link rel="canonical" href="/setup" />
      </Helmet>
      <section className="container py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Snel van start</h1>
          <p className="text-muted-foreground">Stap 1: Huishouden en voorkeuren instellen. Geen account nodig.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Huishouden</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="hh-name">Naam huishouden</Label>
              <Input id="hh-name" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
            </div>

            {people.map((p, idx) => (
              <div key={idx} className="col-span-1 border rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Voornaam</Label>
                  <Input value={p.first_name} onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, first_name: e.target.value } : pp))} />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background"
                    value={p.role}
                    onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, role: e.target.value } : pp))}
                  >
                    <option value="adult">Volwassene</option>
                    <option value="child">Kind</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Minuten per week</Label>
                  <Input type="number" value={p.weekly_time_budget}
                    onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, weekly_time_budget: Number(e.target.value) } : pp))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact (e-mail of telefoon)</Label>
                  <Input value={p.contact}
                    onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, contact: e.target.value } : pp))}
                    placeholder="voor notificaties"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Onprettige klussen</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                    {SEED_TASKS.slice(0, 12).map((t) => (
                      <label key={t.id} className="inline-flex items-center gap-2 text-sm">
                        <Checkbox checked={p.disliked.includes(t.name)} onCheckedChange={() => toggleDisliked(idx, t.name)} />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 flex items-center gap-3">
              <Button variant="secondary" onClick={addPerson}>Persoon toevoegen</Button>
              <Button variant="hero" onClick={saveAndContinue}>Opslaan en verder</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veelvoorkomende blokkades</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {SEED_BLACKOUTS.map((b, i) => (
              <div key={i} className="text-sm text-muted-foreground">
                {b.label}: {b.start}–{b.end}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default SetupWizard;
