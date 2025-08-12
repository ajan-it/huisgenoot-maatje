import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSetupDraft } from "@/hooks/use-setup-draft";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nProvider";
import { SEED_TASKS } from "@/data/seeds";
import { PLAN_WEBHOOK_URL, PLAN_WEBHOOK_SECRET, TIMEZONE } from "@/config";

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

  const title = useMemo(() => `${t("setupFlow.meta.titlePrefix")}${steps[step - 1] ?? ""}`, [step, t, steps]);

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
        toast({ title: "Dubbele voornamen", description: "Gebruik unieke voornamen per persoon voor duidelijkheid." });
        return;
      }
    }
    if (step === 8 && !privacyAccepted) {
      toast({ title: "Accepteer privacyverklaring", description: "Vink de privacyverklaring aan om door te gaan." });
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

    if (import.meta.env.DEV && !PLAN_WEBHOOK_URL) {
      console.log("[DEV] Webhook payload", payload);
      const key = "webhook_log";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.unshift({ ts: new Date().toISOString(), payload });
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
      toast({ title: "Dev: payload gelogd", description: "Bekijk console of localStorage → webhook_log" });
      return;
    }

    try {
      const body = JSON.stringify(payload);
      const timestamp = new Date().toISOString();
      const signature = PLAN_WEBHOOK_SECRET ? await hmacSha256Hex(PLAN_WEBHOOK_SECRET, body) : "";
      const res = await fetch(PLAN_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Plan-Secret": PLAN_WEBHOOK_SECRET || "",
          "X-Plan-Signature": signature ? `sha256=${signature}` : "",
          "X-Plan-Timestamp": timestamp,
        },
        body,
      });
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
        const res2 = await fetch(PLAN_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Plan-Secret": PLAN_WEBHOOK_SECRET || "",
            "X-Plan-Signature": signature ? `sha256=${signature}` : "",
            "X-Plan-Timestamp": new Date().toISOString(),
          },
          body,
        });
        if (!res2.ok) throw new Error(`Webhook error ${res2.status}`);
        const data = await res2.json();
        toast({ title: "Weekplan aangemaakt", description: `Plan ${data.plan_id} • taken: ${data.occurrences} • fairness: ${data.fairness}` });
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Webhook error ${res.status}`);
      }
      const data = await res.json();
      toast({ title: "Weekplan aangemaakt", description: `Plan ${data.plan_id} • taken: ${data.occurrences} • fairness: ${data.fairness}` });
    } catch (e: any) {
      toast({ title: "Kon plan niet aanmaken", description: e?.message || "Er ging iets mis" });
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
          <h1 className="text-3xl font-bold">{steps[step - 1]}</h1>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("setupFlow.household.phone")}</Label>
                      <Input
                        type="tel"
                        value={p.phone || ""}
                        onChange={(e) => updatePerson(p.id, { phone: e.target.value })}
                      />
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

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`consent-${p.id}`}
                        checked={!!p.notify_opt_in}
                        onCheckedChange={(v) => updatePerson(p.id, { notify_opt_in: Boolean(v) })}
                      />
                      <Label htmlFor={`consent-${p.id}`}>{t("setupFlow.household.consentLabel")}</Label>
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

        {step >= 3 && step <= 8 && (
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("setupFlow.placeholder")}
              </p>
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={onBack}>
                  {t("setupFlow.household.back")}
                </Button>
                <Button onClick={onNext} disabled={step === 8}>
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
