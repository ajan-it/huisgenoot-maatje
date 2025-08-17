import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSetupDraft } from "@/hooks/use-setup-draft";
import { useMemo, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import TimeBudgetEstimator from "@/components/setup/TimeBudgetEstimator";
import TargetSplitHint from "@/components/setup/TargetSplitHint";
import MinutesHelperSheet from "@/components/setup/MinutesHelperSheet";
import MinutesQuickChips from "@/components/setup/MinutesQuickChips";
import WorkContextInputs from "@/components/setup/WorkContextInputs";
import OwnershipSelector from "@/components/setup/OwnershipSelector";
import { Info } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SEED_TASKS, SEED_BLACKOUTS } from "@/data/seeds";
import { PLAN_WEBHOOK_URL, PLAN_WEBHOOK_SECRET, TIMEZONE } from "@/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { track } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

const TOTAL_STEPS = 8;

const useStep = () => {
  const params = useParams();
  const step = Math.max(1, Math.min(TOTAL_STEPS, Number(params.step) || 1));
  return step;
};

const StepIndicator = ({ step, labels }: { step: number; labels: string[] }) => (
  <nav aria-label="Wizard steps" className="flex flex-wrap gap-2">
    {labels.map((label, i) => {
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
  const { draft, setDraft, setHousehold, addPerson, updatePerson, removePerson, adultsCount, toggleEmailConsent, toggleSmsConsent } = useSetupDraft();
  const { t, lang } = useI18n();
  const steps = (t("setupFlow.steps") as unknown as string[]) || [];
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastPayloadRef = useRef<any>(null);
  const [estimatorOpenFor, setEstimatorOpenFor] = useState<null | string>(null);
  const [helperSheetOpen, setHelperSheetOpen] = useState(false);

  const title = useMemo(() => `${t("setupFlow.meta.titlePrefix")}${steps[step - 1] ?? ""}`, [step, t, steps]);

  const lastPlanId = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.plan_id || null;
    } catch {
      return null;
    }
  }, []);


  const go = (next: number) => navigate(`/setup/${Math.max(1, Math.min(TOTAL_STEPS, next))}`);

  const onNext = () => {
    // Per-step minimale validatie
    if (step === 2) {
      if (adultsCount < 1) {
        toast({ title: t("setupFlow.validation.minOneAdultTitle"), description: t("setupFlow.validation.minOneAdultDesc") });
        return;
      }
      if (!draft.household.name || draft.household.name.trim().length === 0) {
        toast({ title: t("setupFlow.validation.householdNameMissingTitle"), description: t("setupFlow.validation.householdNameMissingDesc") });
        return;
      }
      const names = draft.people.map((p) => (p.first_name || "").trim().toLowerCase()).filter(Boolean);
      const dupExists = names.some((n, i) => names.indexOf(n) !== i);
      if (dupExists) {
        toast({ title: lang === "en" ? "Duplicate first names" : "Dubbele voornamen", description: lang === "en" ? "Use unique first names per person for clarity." : "Gebruik unieke voornamen per persoon voor duidelijkheid." });
        return;
      }
    }
    if (step === 3) {
      const missing = draft.people.filter((p) => p.role === "adult").some((p) => p.weekly_time_budget === undefined || p.weekly_time_budget === null);
      if (missing) {
        toast({ title: lang === "en" ? "Minutes per week missing" : "Minuten per week ontbreekt", description: lang === "en" ? "Enter the weekly time budget for all adults." : "Vul het wekelijkse tijdsbudget in voor alle volwassenen." });
        return;
      }
    }
    if (step === 8 && !privacyAccepted) {
      toast({ title: lang === "en" ? "Accept privacy policy" : "Accepteer privacyverklaring", description: lang === "en" ? "Tick the privacy policy to continue." : "Vink de privacyverklaring aan om door te gaan." });
      return;
    }
    go(step + 1);
  };

  const onBack = () => go(step - 1);

  // Helpers
  const normalizeEmail = (s: string) => s.trim().toLowerCase();
  const digits = (s: string) => s.replace(/[^0-9+]/g, "");
  const formatDutchPhone = (raw: string) => {
    let v = digits(raw);
    if (v.startsWith("+31")) return v;
    if (v.startsWith("06")) return "+31" + v.slice(1);
    if (v.startsWith("6")) return "+31" + v;
    if (v.startsWith("0")) return "+31" + v.slice(1);
    if (v.startsWith("+")) return v; // other country, accept as-is
    return v; // leave cleaned
  };
  const isValidE164 = (s?: string) => !!s && /^\+[1-9]\d{7,14}$/.test(s);

  const allTags = useMemo(() => Array.from(new Set(SEED_TASKS.flatMap((t) => t.tags || []))), []);
  const categories = useMemo(() => ["all", ...Array.from(new Set(SEED_TASKS.map((t) => t.category)))] , []);
  const dayKeys: ("Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun")[] = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weekdayKeys: ("Mon"|"Tue"|"Wed"|"Thu"|"Fri")[] = ["Mon","Tue","Wed","Thu","Fri"];
  const dayLabels: Record<typeof dayKeys[number], string> = { Mon: "Ma", Tue: "Di", Wed: "Wo", Thu: "Do", Fri: "Vr", Sat: "Za", Sun: "Zo" };

  const [taskSearch, setTaskSearch] = useState("");
  const [taskCategory, setTaskCategory] = useState<string>("all");

  const applyToddlerPreset = () => {
    const mapIds = ["t1","t2","t5","t6","t4","t7","t8","t9","t10","t15","t16","t17","t18","t3","t11","t12","t13","t19","t22","t23"];
    setDraft((d) => {
      const nextTasks = [...d.tasks];
      // Ensure each selected task exists and is active
      for (const id of mapIds) {
        const idx = nextTasks.findIndex((t) => t.id === id);
        if (idx >= 0) nextTasks[idx] = { ...nextTasks[idx], active: true };
        else nextTasks.push({ id, active: true });
      }
      // Also ensure all seed tasks are present in draft (inactive by default)
      for (const seed of SEED_TASKS) {
        if (!nextTasks.find((t) => t.id === seed.id)) nextTasks.push({ id: seed.id, active: false });
      }
      toast({ title: "Aanbevolen selectie toegepast", description: `${mapIds.length} taken geactiveerd.` });
      return { ...d, tasks: nextTasks };
    });
  };
  const nextMondayISO = () => {
    const now = new Date();
    const day = now.getDay(); // 0 Sun..6 Sat
    const delta = ((8 - (day || 7)) % 7) || 7; // days until next Monday
    const next = new Date(now);
    next.setDate(now.getDate() + delta);
    next.setHours(0, 0, 0, 0);
    return next.toISOString().slice(0, 10); // yyyy-mm-dd
  };

  const hmacSha256Hex = async (secret: string, body: string) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const generatePlan = async () => {
    const week_start = nextMondayISO();
    const household_id = "HH_LOCAL"; // local draft id placeholder
    const requested_by_person_id = draft.people.find((p) => p.role === "adult")?.id || draft.people[0]?.id || "P_LOCAL";
    const locale = draft.people[0]?.locale || (lang as any);
    const payload = {
      event: "generate_plan",
      version: "2025-08-11",
      household_id,
      week_start,
      timezone: TIMEZONE,
      locale,
      requested_by_person_id,
      dry_run: false,
      idempotency_key: `${household_id}-${week_start}`,
      settings: {
        lighten_weekdays: !!draft.household.settings?.lighten_weekdays,
        kids_weekends_only: !!draft.household.settings?.kids_weekends_only,
      },
    };

    lastPayloadRef.current = payload;
    setGenerating(true);
    setErrorMsg(null);
    const started = performance.now();

    if (!PLAN_WEBHOOK_URL) {
      try {
        const { data, error } = await supabase.functions.invoke("plan-generate", {
          body: {
            ...payload,
            people: draft.people,
            tasks: draft.tasks,
            blackouts: draft.blackouts,
          },
        });
        if (error) throw error;
        const plan_id = (data as any)?.plan_id || `DEV-${Math.random().toString(36).slice(2, 8)}`;
        const occurrences = (data as any)?.occurrences ?? 0;
        const fairness = (data as any)?.fairness ?? 0;
        localStorage.setItem(
          "lastPlanResponse",
          JSON.stringify({ ...(data as any), plan_id, occurrences, fairness, week_start, created_at: new Date().toISOString() })
        );
        toast({ title: lang === "en" ? "Plan created" : "Weekplan aangemaakt", description: lang === "en" ? `Plan ${plan_id} • tasks: ${occurrences} • fairness: ${fairness}` : `Plan ${plan_id} • taken: ${occurrences} • fairness: ${fairness}` });
        track("webhook_success", { duration_ms: Math.round(performance.now() - started), occurrences, fairness });
        track("wizard_done", { household_id, adults: adultsCount, active_tasks_count: draft.tasks.filter((t) => t.active).length });
        setGenerating(false);
        navigate("/setup/done");
        return;
      } catch (err: any) {
        console.error("plan-generate failed, using fallback", err);
        const fake = { plan_id: `DEV-${Math.random().toString(36).slice(2, 8)}`, occurrences: 42, fairness: 86 };
        localStorage.setItem(
          "lastPlanResponse",
          JSON.stringify({ ...fake, week_start, created_at: new Date().toISOString() })
        );
        toast({ title: lang === "en" ? "Plan created (fallback)" : "Weekplan aangemaakt (fallback)", description: lang === "en" ? `Plan ${fake.plan_id} • tasks: ${fake.occurrences} • fairness: ${fake.fairness}` : `Plan ${fake.plan_id} • taken: ${fake.occurrences} • fairness: ${fake.fairness}` });
        track("webhook_success", { duration_ms: Math.round(performance.now() - started), occurrences: fake.occurrences, fairness: fake.fairness });
        track("wizard_done", { household_id, adults: adultsCount, active_tasks_count: draft.tasks.filter((t) => t.active).length });
        setGenerating(false);
        navigate("/setup/done");
        return;
      }
    }

    try {
      const body = JSON.stringify(payload);
      const timestamp = new Date().toISOString();
      const signature = PLAN_WEBHOOK_SECRET ? await hmacSha256Hex(PLAN_WEBHOOK_SECRET, body) : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Plan-Secret": PLAN_WEBHOOK_SECRET || "",
        "X-Plan-Signature": signature ? `sha256=${signature}` : "",
        "X-Plan-Timestamp": timestamp,
        "Idempotency-Key": payload.idempotency_key,
      };

      const res = await fetch(PLAN_WEBHOOK_URL, { method: "POST", headers, body });

      const handleOk = async (response: Response) => {
        let data: any = {};
        try { data = await response.json(); } catch {}
        const plan_id = data.plan_id || `${household_id}-${week_start}`;
        const occurrences = data.occurrences ?? 0;
        const fairness = data.fairness ?? 0;
        localStorage.setItem(
          "lastPlanResponse",
          JSON.stringify({ ...data, plan_id, occurrences, fairness, week_start, created_at: new Date().toISOString() })
        );
        toast({ title: lang === "en" ? "Plan created" : "Weekplan aangemaakt", description: lang === "en" ? `Plan ${plan_id} • tasks: ${occurrences} • fairness: ${fairness}` : `Plan ${plan_id} • taken: ${occurrences} • fairness: ${fairness}` });
        track("webhook_success", { duration_ms: Math.round(performance.now() - started), occurrences, fairness });
        track("wizard_done", { household_id, adults: adultsCount, active_tasks_count: draft.tasks.filter((t) => t.active).length });
        setGenerating(false);
        navigate("/setup/done");
      };

      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
        const res2 = await fetch(PLAN_WEBHOOK_URL, { method: "POST", headers: { ...headers, "X-Plan-Timestamp": new Date().toISOString() }, body });
        if (res2.ok || res2.status === 409) return handleOk(res2);
        throw new Error(`Webhook error ${res2.status}`);
      }

      if (res.ok || res.status === 409) {
        return handleOk(res);
      }

      const text = await res.text();
      setErrorMsg(text || `Webhook error ${res.status}`);
      track("webhook_fail", { duration_ms: Math.round(performance.now() - started), error_code: res.status });
      setGenerating(false);
    } catch (e: any) {
      const msg = e?.message || "Er ging iets mis";
      setErrorMsg(msg);
      track("webhook_fail", { duration_ms: Math.round(performance.now() - started), error_code: "exception" });
      setGenerating(false);
    }
  };


  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={`${t("setupFlow.meta.titlePrefix")}${steps[step - 1] ?? ""}`} />
        <link rel="canonical" href={`/setup/${step}`} />
      </Helmet>

      <section className="container py-8 space-y-6">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold">{steps[step - 1]}</h1>
            <div className="flex flex-wrap gap-2">
              {lastPlanId && (
                <Button variant="secondary" onClick={() => navigate(`/plan/${lastPlanId}`)}>
                  {t('setupFlow.actions.openPlan')}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/")}>{t('setupFlow.actions.exitSetup')}</Button>
            </div>
          </div>
          <StepIndicator step={step} labels={steps} />
        </header>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("setupFlow.welcome.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("setupFlow.welcome.headline")}
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {((t("setupFlow.welcome.bullets") as unknown) as string[]).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Button onClick={() => go(2)}>{t("setupFlow.welcome.start")}</Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("setupFlow.welcome.gdprHint")}</p>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("setupFlow.household.pageTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="hh-name">{t("setupFlow.household.householdName")}</Label>
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
                      <Label>{t("setupFlow.household.firstName")}</Label>
                      <Input
                        value={p.first_name}
                        onChange={(e) => updatePerson(p.id, { first_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("setupFlow.household.role")}</Label>
                      <select
                        className="h-10 w-full rounded-md border bg-background"
                        value={p.role}
                        onChange={(e) => updatePerson(p.id, { role: e.target.value as any })}
                      >
                        <option value="adult">{t("setupFlow.household.roleAdult")}</option>
                        <option value="child">{t("setupFlow.household.roleChild")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("setupFlow.household.email")}</Label>
                      <Input
                        type="email"
                        value={p.email || ""}
                        onChange={(e) => updatePerson(p.id, { email: e.target.value })}
                        onBlur={(e) => updatePerson(p.id, { email: normalizeEmail(e.currentTarget.value) || undefined })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("setupFlow.household.phone")}</Label>
                      <Input
                        type="tel"
                        value={p.phone || ""}
                        onChange={(e) => updatePerson(p.id, { phone: e.target.value })}
                        onBlur={(e) => updatePerson(p.id, { phone: formatDutchPhone(e.currentTarget.value) })}
                        aria-describedby={`phone-hint-${p.id}`}
                      />
                      <p id={`phone-hint-${p.id}`} className="text-xs text-muted-foreground">{lang === "en" ? "Dutch numbers start with +31 or 06." : "Nederlandse nummers beginnen met +31 of 06."}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("setupFlow.household.language")}</Label>
                      <select
                        className="h-10 w-full rounded-md border bg-background"
                        value={p.locale}
                        onChange={(e) => updatePerson(p.id, { locale: e.target.value as any })}
                      >
                        <option value="nl">Nederlands</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="space-y-3 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`consent-email-${p.id}`}
                          checked={!!p.notify_email_opt_in}
                          onCheckedChange={(v) => toggleEmailConsent(p.id, Boolean(v))}
                          disabled={!p.email}
                        />
                        <Label htmlFor={`consent-email-${p.id}`}>E-mailmeldingen toestaan</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`consent-sms-${p.id}`}
                          checked={!!p.notify_sms_opt_in}
                          onCheckedChange={(v) => toggleSmsConsent(p.id, Boolean(v))}
                          disabled={!isValidE164(p.phone)}
                        />
                        <Label htmlFor={`consent-sms-${p.id}`}>WhatsApp/SMS toestaan</Label>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex gap-3">
                      <Button variant="secondary" onClick={() => updatePerson(p.id, { role: p.role })} disabled>
                        {t("common.save")}
                      </Button>
                      <Button variant="destructive" onClick={() => removePerson(p.id)}>
                        {t("setupFlow.household.delete")}
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => addPerson("adult")}>{t("setupFlow.household.addAdult")}</Button>
                  <Button variant="secondary" onClick={() => addPerson("child")}>{t("setupFlow.household.addChild")}</Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext}>{t("setupFlow.household.next")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="text-sm text-muted-foreground">Actieve taken: {draft.tasks.filter((t) => t.active).length}</div>
                <div className="flex gap-2">
                  <Input placeholder="Zoeken" value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} className="w-40" />
                  <select className="h-10 rounded-md border bg-background" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Button variant="secondary" onClick={applyToddlerPreset}>Aanbevolen selectie</Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {SEED_TASKS.filter((t) => (taskCategory === "all" || t.category === taskCategory) && t.name.toLowerCase().includes(taskSearch.toLowerCase())).map((t) => {
                  const sel = draft.tasks.find((x) => x.id === t.id);
                  const active = !!sel?.active;
                  return (
                    <label key={t.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-muted-foreground">{t.category} • {t.frequency} • {t.default_duration}m</div>
                      </div>
                      <Checkbox
                        checked={active}
                        onCheckedChange={(v) =>
                          setDraft((d) => {
                            const idx = d.tasks.findIndex((x) => x.id === t.id);
                            const next = [...d.tasks];
                            if (idx >= 0) next[idx] = { ...next[idx], active: Boolean(v) };
                            else next.push({ id: t.id, active: Boolean(v) });
                            return { ...d, tasks: next };
                          })
                        }
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext}>
                  {t("setupFlow.household.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 8 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Personen: {draft.people.length} • Volwassenen: {adultsCount} • Actieve taken: {draft.tasks.filter((t) => t.active).length}</div>
                <div className="flex items-center gap-2">
                  <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={(v) => setPrivacyAccepted(Boolean(v))} />
                  <Label htmlFor="privacy">Ik ga akkoord met de <a href="/privacy" className="underline">privacyverklaring</a>.</Label>
                </div>
              </div>

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertTitle>Kon plan niet aanmaken</AlertTitle>
                  <AlertDescription>{errorMsg}</AlertDescription>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={generatePlan} disabled={generating}>Opnieuw proberen</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(JSON.stringify(lastPayloadRef.current, null, 2));
                          toast({ title: "Payload gekopieerd", description: "Plak deze in je bericht aan support." });
                        } catch {}
                      }}
                    >
                      Payload kopiëren
                    </Button>
                  </div>
                </Alert>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack} disabled={generating}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={generatePlan} disabled={!privacyAccepted || generating}>
                  {generating ? "Bezig..." : "Genereer weekplan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {draft.people.filter((p) => p.role === "adult").map((p, index) => (
                <div key={p.id} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-lg">{p.first_name}</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor={`min-week-${p.id}`}>{t("setupFlow.timePrefs.minutesPerWeek")}</Label>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setHelperSheetOpen(true)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("time.minutes.help")}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setEstimatorOpenFor(p.id)}
                            className="h-6 px-2 text-xs"
                          >
                            {t("setupFlow.timePrefs.makeEstimate")}
                          </Button>
                        </div>
                      </div>
                      <Input
                        id={`min-week-${p.id}`}
                        type="number"
                        min={0}
                        max={600}
                        placeholder="90"
                        value={p.weekly_time_budget ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? undefined : Math.max(0, Math.min(600, Number(e.target.value)));
                          updatePerson(p.id, { weekly_time_budget: v as any });
                        }}
                        onBlur={(e) => {
                          if (e.currentTarget.value === "") updatePerson(p.id, { weekly_time_budget: 90 });
                        }}
                      />
                      <MinutesQuickChips
                        adultsCount={adultsCount}
                        childrenCount={draft.people.filter(p => p.role === "child").length}
                        currentMinutes={p.weekly_time_budget}
                        onSelectMinutes={(minutes) => updatePerson(p.id, { weekly_time_budget: minutes })}
                      />
                      <WorkContextInputs
                        person={p}
                        onUpdate={(updates) => updatePerson(p.id, updates)}
                        onUpdateBudget={() => setEstimatorOpenFor(p.id)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("setupFlow.timePrefs.minutesPerWeekHelp")}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor={`cap-weeknight-${p.id}`}>{t("setupFlow.timePrefs.maxWeeknightMinutes")}</Label>
                      <Input
                        id={`cap-weeknight-${p.id}`}
                        type="number"
                        min={0}
                        max={300}
                        placeholder="30"
                        value={p.weeknight_cap ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? undefined : Math.max(0, Math.min(300, Number(e.target.value)));
                          updatePerson(p.id, { weeknight_cap: v as any });
                        }}
                        onBlur={(e) => {
                          if (e.currentTarget.value === "") updatePerson(p.id, { weeknight_cap: 30 });
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("setupFlow.timePrefs.maxWeeknightMinutesHelp")}
                      </p>
                    </div>
                  </div>
                   
                  <div>
                    <Label>{t("setupFlow.timePrefs.dislikedTags")}</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("setupFlow.timePrefs.dislikedTagsHelp")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const active = (p.disliked_tags || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`px-3 py-1 rounded-full border text-sm ${active ? "bg-primary/10 border-primary" : "opacity-70"}`}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                people: d.people.map((pp) =>
                                  pp.id === p.id
                                    ? {
                                        ...pp,
                                        disliked_tags: active
                                          ? (pp.disliked_tags || []).filter((t) => t !== tag)
                                          : [...(pp.disliked_tags || []), tag],
                                      }
                                    : pp
                                ),
                              }))
                            }
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>{t("setupFlow.timePrefs.noGoTasks")}</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("setupFlow.timePrefs.noGoTasksHelp")}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-auto pr-1">
                      {SEED_TASKS.map((t) => {
                        const checked = (p.no_go_tasks || []).includes(t.id);
                        return (
                          <label key={t.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  people: d.people.map((pp) =>
                                    pp.id === p.id
                                      ? {
                                          ...pp,
                                          no_go_tasks: e.target.checked
                                            ? [...(pp.no_go_tasks || []), t.id]
                                            : (pp.no_go_tasks || []).filter((x) => x !== t.id),
                                        }
                                      : pp
                                  ),
                                }))
                              }
                            />
                            <span>{t.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Target split hint after all adults */}
              <TargetSplitHint 
                adultsMinutes={draft.people.filter(p => p.role === "adult").map(p => p.weekly_time_budget || 0)}
              />

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext}>
                  {t("setupFlow.household.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Budget Estimator Dialog */}
        {estimatorOpenFor && (
          <TimeBudgetEstimator
            open={true}
            onOpenChange={() => setEstimatorOpenFor(null)}
            personName={draft.people.find(p => p.id === estimatorOpenFor)?.first_name ?? ""}
            initialMinutes={draft.people.find(p => p.id === estimatorOpenFor)?.weekly_time_budget ?? 60}
            onApply={(minutes) => {
              updatePerson(estimatorOpenFor, { weekly_time_budget: minutes });
              setEstimatorOpenFor(null);
            }}
          />
        )}

        {/* Minutes Helper Sheet */}
        <MinutesHelperSheet 
          open={helperSheetOpen}
          onOpenChange={setHelperSheetOpen}
        />

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Presets</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {SEED_BLACKOUTS.map((b, i) => (
                    <div key={i} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-sm">
                        <div className="font-medium">{b.label}</div>
                        <div className="text-muted-foreground">{b.days.map((d) => dayLabels[d]).join(", ")} • {b.start}–{b.end}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setDraft((d) => {
                            const adultId = d.people.find((pp) => pp.role === "adult")?.id || d.people[0]?.id;
                            if (!adultId) return d;
                            const newItem = {
                              id: Math.random().toString(36).slice(2, 10),
                              person_id: adultId,
                              days: b.days,
                              start: b.start,
                              end: b.end,
                              label: b.label,
                            } as any;
                            return { ...d, blackouts: [...d.blackouts, newItem] };
                          })
                        }
                      >
                        Toevoegen
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDraft((d) => {
                      const personId = d.people[0]?.id;
                      if (!personId) return d;
                      const newItem = { id: Math.random().toString(36).slice(2,10), person_id: personId, days: ["Mon" as const], start: "09:00", end: "10:00" };
                      return { ...d, blackouts: [...d.blackouts, newItem as any] };
                    })
                  }
                >
                  Nieuwe blackout
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Afspraken</Label>
                {draft.blackouts.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nog geen blackouts toegevoegd.</p>
                )}
                {draft.blackouts.map((b) => {
                  const person = draft.people.find((pp) => pp.id === b.person_id);
                  const overlap = draft.blackouts.some((o) => {
                    if (o.id === b.id || o.person_id !== b.person_id) return false;
                    const shareDay = o.days.some((d) => b.days.includes(d));
                    if (!shareDay) return false;
                    return !(o.end <= b.start || b.end <= o.start);
                  });
                  return (
                    <div key={b.id} className="border rounded-md p-3 space-y-3">
                      <div className="grid sm:grid-cols-4 gap-3 items-end">
                        <div>
                          <Label>Persoon</Label>
                          <select
                            className="h-10 w-full rounded-md border bg-background"
                            value={b.person_id}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                blackouts: d.blackouts.map((x) => (x.id === b.id ? { ...x, person_id: e.target.value } : x)),
                              }))
                            }
                          >
                            {draft.people.map((pp) => (
                              <option key={pp.id} value={pp.id}>{pp.first_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Dagen</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {dayKeys.map((dk) => {
                              const active = b.days.includes(dk);
                              return (
                                <button
                                  key={dk}
                                  type="button"
                                  className={`px-3 py-1 rounded-full border text-sm ${active ? "bg-primary/10 border-primary" : "opacity-70"}`}
                                  onClick={() =>
                                    setDraft((d) => ({
                                      ...d,
                                      blackouts: d.blackouts.map((x) =>
                                        x.id === b.id
                                          ? { ...x, days: active ? x.days.filter((d0) => d0 !== dk) : [...x.days, dk] }
                                          : x
                                      ),
                                    }))
                                  }
                                >
                                  {dayLabels[dk]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <Label>Start</Label>
                          <Input
                            type="time"
                            value={b.start}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                blackouts: d.blackouts.map((x) => (x.id === b.id ? { ...x, start: e.target.value } : x)),
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Einde</Label>
                          <Input
                            type="time"
                            value={b.end}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                blackouts: d.blackouts.map((x) => (x.id === b.id ? { ...x, end: e.target.value } : x)),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-4 gap-3 items-end">
                        <div className="sm:col-span-3">
                          <Label>Notitie</Label>
                          <Input
                            value={b.note || ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                blackouts: d.blackouts.map((x) => (x.id === b.id ? { ...x, note: e.target.value } : x)),
                              }))
                            }
                          />
                          {overlap && <p className="text-xs text-destructive mt-1">Conflict: overlappende tijden op dezelfde dag.</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setDraft((d) => {
                                const adults = d.people.filter((pp) => pp.role === "adult");
                                const newItems = adults
                                  .filter((a) => a.id !== b.person_id)
                                  .map((a) => ({ ...b, id: Math.random().toString(36).slice(2, 10), person_id: a.id }));
                                return { ...d, blackouts: [...d.blackouts, ...newItems] };
                              })
                            }
                          >
                            Kopieer naar beide volwassenen
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setDraft((d) => ({ ...d, blackouts: d.blackouts.filter((x) => x.id !== b.id) }))}
                          >
                            Verwijderen
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="text-sm text-muted-foreground">
                  Samenvatting: {draft.people.map((pp) => `${pp.first_name}: ${draft.blackouts.filter((b) => b.person_id === pp.id).length}`).join(" • ")}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext}>
                  {t("setupFlow.household.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant={draft.household.settings?.lighten_weekdays ? "secondary" : "outline"} onClick={() => setHousehold({ settings: { ...draft.household.settings, lighten_weekdays: !draft.household.settings?.lighten_weekdays } })}>
                  Houd doordeweeks licht
                </Button>
                <Button variant={draft.household.settings?.kids_weekends_only ? "secondary" : "outline"} onClick={() => setHousehold({ settings: { ...draft.household.settings, kids_weekends_only: !draft.household.settings?.kids_weekends_only } })}>
                  Kids alleen in weekend
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Taak</th>
                      <th className="p-2">Frequentie</th>
                      <th className="p-2">Duur (min)</th>
                      <th className="p-2">Moeilijkheid</th>
                      <th className="p-2">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.tasks.filter((x) => x.active).map((x) => {
                      const seed = SEED_TASKS.find((t) => t.id === x.id);
                      if (!seed) return null;
                      const freq = x.frequency || seed.frequency;
                      const dur = x.default_duration ?? seed.default_duration;
                      const diff = x.difficulty || seed.difficulty;
                      const tags = Array.from(new Set([...(seed.tags || []), ...(x.tags || [])]));
                      const invalid = !dur || dur <= 0;
                      return (
                        <tr key={x.id} className="border-t">
                          <td className="p-2">{seed.name}</td>
                          <td className="p-2">
                            <select
                              className="h-9 rounded-md border bg-background"
                              value={freq}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  tasks: d.tasks.map((tt) => (tt.id === x.id ? { ...tt, frequency: e.target.value as any } : tt)),
                                }))
                              }
                            >
                              <option value="daily">daily</option>
                              <option value="weekly">weekly</option>
                              <option value="monthly">monthly</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              className={invalid ? "border-destructive" : ""}
                              value={dur}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  tasks: d.tasks.map((tt) =>
                                    tt.id === x.id ? { ...tt, default_duration: Math.max(1, Number(e.target.value || 0)) } : tt
                                  ),
                                }))
                              }
                            />
                            {invalid && <p className="text-xs text-destructive">Ongeldige duur</p>}
                          </td>
                          <td className="p-2">
                            <select
                              className="h-9 rounded-md border bg-background"
                              value={diff}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  tasks: d.tasks.map((tt) => (tt.id === x.id ? { ...tt, difficulty: Number(e.target.value) as any } : tt)),
                                }))
                              }
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => {
                                const active = (x.tags || seed.tags || []).includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    className={`px-3 py-1 rounded-full border ${active ? "bg-primary/10 border-primary" : "opacity-70"}`}
                                    onClick={() =>
                                      setDraft((d) => ({
                                        ...d,
                                        tasks: d.tasks.map((tt) =>
                                          tt.id === x.id
                                            ? {
                                                ...tt,
                                                tags: active
                                                  ? (tt.tags || []).filter((t0) => t0 !== tag)
                                                  : [...(tt.tags || []), tag],
                                              }
                                            : tt
                                        ),
                                      }))
                                    }
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext}>
                  {t("setupFlow.household.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Postcode</Label>
                  <Input
                    value={draft.household.postcode || ""}
                    onChange={(e) => setHousehold({ postcode: e.target.value })}
                    onBlur={(e) => {
                      const raw = e.currentTarget.value.toUpperCase().replace(/\s+/g, "");
                      const formatted = raw.length >= 6 ? `${raw.slice(0, 4)} ${raw.slice(4, 6)}` : raw;
                      setHousehold({ postcode: formatted });
                      const ok = /^\d{4}\s?[A-Z]{2}$/.test(formatted);
                      if (!ok && formatted) toast({ title: "Ongeldige postcode", description: "Gebruik het formaat 1234 AB" });
                    }}
                  />
                </div>
                <div>
                  <Label>Huisnummer</Label>
                  <Input value={draft.household.house_no || ""} onChange={(e) => setHousehold({ house_no: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Afval schema</Label>
                <div className="space-y-2">
                  {(draft.local_context?.waste_days || []).map((w, idx) => (
                    <div key={idx} className="grid sm:grid-cols-3 gap-2 items-center">
                      <select
                        className="h-10 rounded-md border bg-background"
                        value={w.type}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            local_context: {
                              ...d.local_context,
                              waste_days: (d.local_context?.waste_days || []).map((x, i) => (i === idx ? { ...x, type: e.target.value } : x)),
                            },
                          }))
                        }
                      >
                        {['GFT','PMD','Rest','Papier'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-md border bg-background"
                        value={w.day}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            local_context: {
                              ...d.local_context,
                              waste_days: (d.local_context?.waste_days || []).map((x, i) => (i === idx ? { ...x, day: e.target.value } : x)),
                            },
                          }))
                        }
                      >
                        {dayKeys.map((dk) => (
                          <option key={dk} value={dk}>{dayLabels[dk]}</option>
                        ))}
                      </select>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            local_context: { ...d.local_context, waste_days: (d.local_context?.waste_days || []).filter((_, i) => i !== idx) },
                          }))
                        }
                      >
                        Verwijderen
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        local_context: { ...d.local_context, waste_days: [...(d.local_context?.waste_days || []), { type: 'GFT', day: 'Mon' }] },
                      }))
                    }
                  >
                    Rij toevoegen
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>School / opvang (optioneel)</Label>
                <div className="grid sm:grid-cols-3 gap-2 items-end">
                  <div>
                    <Label>Brengtijd</Label>
                    <Input
                      type="time"
                      value={draft.local_context?.school_times?.dropoff || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, local_context: { ...d.local_context, school_times: { ...(d.local_context?.school_times || {}), dropoff: e.target.value } } }))}
                    />
                  </div>
                  <div>
                    <Label>Ophaaltijd</Label>
                    <Input
                      type="time"
                      value={draft.local_context?.school_times?.pickup || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, local_context: { ...d.local_context, school_times: { ...(d.local_context?.school_times || {}), pickup: e.target.value } } }))}
                    />
                  </div>
                  <div>
                    <Label>Dagen</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weekdayKeys.map((dk) => {
                        const currentDays = (draft.local_context?.school_times?.days || []);
                        const active = currentDays.includes(dk as (typeof weekdayKeys)[number]);
                        return (
                          <button
                            key={dk}
                            type="button"
                            className={`px-3 py-1 rounded-full border text-sm ${active ? "bg-primary/10 border-primary" : "opacity-70"}`}
                            onClick={() =>
                              setDraft((d) => {
                                const existing = (d.local_context?.school_times?.days || []) as (typeof weekdayKeys)[number][];
                                const nextDays = active
                                  ? (existing.filter((x) => x !== dk) as (typeof weekdayKeys)[number][])
                                  : ([...existing, dk] as (typeof weekdayKeys)[number][]);
                                return {
                                  ...d,
                                  local_context: {
                                    ...d.local_context,
                                    school_times: {
                                      ...(d.local_context?.school_times || {}),
                                      days: nextDays,
                                    },
                                  },
                                };
                              })
                            }
                          >
                            {dayLabels[dk]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext}>
                  {t("setupFlow.household.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


      </section>
    </main>
  );
}
