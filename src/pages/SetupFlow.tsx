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
import { useI18n } from "@/i18n/I18nProvider";

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
  const { draft, setHousehold, addPerson, updatePerson, removePerson, adultsCount } = useSetupDraft();
  const { t } = useI18n();
  const steps = (t("setupFlow.steps") as unknown as string[]) || [];

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
    }
    go(step + 1);
  };

  const onBack = () => go(step - 1);

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
