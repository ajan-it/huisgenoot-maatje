import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SEED_TASKS, SEED_BLACKOUTS } from "@/data/seeds";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nProvider";
const SetupWizard = () => {
  const { t: translate, lang } = useI18n();
  const [householdName, setHouseholdName] = useState("Ons huishouden");
  const [people, setPeople] = useState([
    { first_name: "Ouder 1", role: "adult", weekly_time_budget: 300, contact: "", disliked: [] as string[] },
    { first_name: "Ouder 2", role: "adult", weekly_time_budget: 300, contact: "", disliked: [] as string[] },
  ]);

  // Local-first: laad en bewaar concept in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("setupDraft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.householdName) setHouseholdName(parsed.householdName);
        if (Array.isArray(parsed.people)) setPeople(parsed.people);
      }
    } catch (e) {
      console.warn("Kon setupDraft niet laden", e);
    }
  }, []);

  useEffect(() => {
    const draft = { householdName, people };
    try {
      localStorage.setItem("setupDraft", JSON.stringify(draft));
    } catch (e) {
      console.warn("Kon setupDraft niet opslaan", e);
    }
  }, [householdName, people]);

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
    toast({ title: translate('setup.toastSavedLocalTitle'), description: translate('setup.toastSavedLocalDesc') });
  };

  const persistToSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: translate('setup.toastNeedAccountTitle'), description: translate('setup.toastNeedAccountDesc'), });
      window.location.href = "/auth?next=" + encodeURIComponent("/setup?action=persist");
      return;
    }

    // 1) Maak household
    const { data: hh, error: hhErr } = await (supabase as any)
      .from("households")
      .insert([{ postcode: null, settings: { name: householdName } }])
      .select("id")
      .maybeSingle();

    if (hhErr || !hh) {
      toast({ title: translate('setup.toastErrorTitle'), description: hhErr?.message ?? "Onbekende fout" });
      return;
    }

    // 2) Voeg personen toe
    const peopleRows = people.map((p: any) => ({
      household_id: hh.id,
      first_name: p.first_name,
      role: p.role,
      weekly_time_budget: Number(p.weekly_time_budget) || 0,
      disliked_tasks: Array.isArray(p.disliked) ? p.disliked : [],
      no_go_tasks: [],
      contact: p.contact ? { raw: p.contact } : null,
      locale: lang,
    }));

    const { error: pplErr } = await (supabase as any).from("people").insert(peopleRows);
    if (pplErr) {
      toast({ title: translate('setup.toastErrorTitle'), description: pplErr.message });
      return;
    }

    localStorage.removeItem("setupDraft");
    toast({ title: translate('setup.toastSavedRemoteTitle'), description: translate('setup.toastSavedRemoteDesc') });
  };
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{translate('setup.title')}</title>
        <meta name="description" content={translate('setup.metaDescription')} />
        <link rel="canonical" href="/setup" />
      </Helmet>
      <section className="container py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">{translate('setup.header')}</h1>
          <p className="text-muted-foreground">{translate('setup.subtext')}</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{translate('setup.household')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="hh-name">{translate('setup.householdName')}</Label>
              <Input id="hh-name" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
            </div>

            {people.map((p, idx) => (
              <div key={idx} className="col-span-1 border rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <Label>{translate('setup.firstName')}</Label>
                  <Input value={p.first_name} onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, first_name: e.target.value } : pp))} />
                </div>
                <div className="space-y-2">
                  <Label>{translate('setup.role')}</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background"
                    value={p.role}
                    onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, role: e.target.value } : pp))}
                  >
                    <option value="adult">{translate('setup.roleAdult')}</option>
                    <option value="child">{translate('setup.roleChild')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{translate('setup.minutesPerWeek')}</Label>
                  <Input type="number" value={p.weekly_time_budget}
                    onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, weekly_time_budget: Number(e.target.value) } : pp))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{translate('setup.contact')}</Label>
                  <Input value={p.contact}
                    onChange={(e) => setPeople((ps) => ps.map((pp, i) => i === idx ? { ...pp, contact: e.target.value } : pp))}
                    placeholder={translate('setup.contactPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{translate('setup.dislikedTasks')}</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                    {SEED_TASKS.slice(0, 12).map((task) => (
                      <label key={task.id} className="inline-flex items-center gap-2 text-sm">
                        <Checkbox checked={p.disliked.includes(task.name)} onCheckedChange={() => toggleDisliked(idx, task.name)} />
                        <span>{translate(`setup.taskLabels.${task.id}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 flex items-center gap-3">
              <Button variant="secondary" onClick={addPerson}>{translate('setup.addPerson')}</Button>
              <Button variant="hero" onClick={saveAndContinue}>{translate('setup.saveAndContinue')}</Button>
              <Button onClick={persistToSupabase}>{translate('setup.saveToAccount')}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate('setup.blackoutsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {SEED_BLACKOUTS.map((b, i) => (
              <div key={i} className="text-sm text-muted-foreground">
                {translate(`setup.blackoutsList.${i}`)}: {b.start}–{b.end}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default SetupWizard;
