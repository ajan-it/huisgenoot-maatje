import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
function useLastPlan() {
  const [plan, setPlan] = useState<null | any>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      console.log("SetupDone: Raw localStorage data:", raw);
      if (!raw) {
        console.log("SetupDone: No lastPlanResponse in localStorage");
        return;
      }
      const parsed = JSON.parse(raw);
      console.log("SetupDone: Parsed plan data:", parsed);
      
      if (!parsed.created_at) {
        console.log("SetupDone: Plan data missing created_at, using current time");
        // If no created_at, assume it's fresh (just created)
        setPlan(parsed);
        return;
      }
      
      const fresh = Date.now() - Date.parse(parsed.created_at) < 24 * 60 * 60 * 1000;
      console.log("SetupDone: Plan freshness check:", {
        created_at: parsed.created_at,
        age_hours: (Date.now() - Date.parse(parsed.created_at)) / (1000 * 60 * 60),
        is_fresh: fresh
      });
      
      if (fresh) {
        setPlan(parsed);
      } else {
        console.log("SetupDone: Plan data is too old (>24 hours)");
      }
    } catch (error) {
      console.error("SetupDone: Error parsing plan data:", error);
    }
  }, []);
  return plan;
}

const formatDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return isoDate;
  }
};

const toYmd = (isoDate: string) => isoDate.split("-").join("");

const SetupDone = () => {
  const plan = useLastPlan();
  const navigate = useNavigate();
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const { lang, t } = useI18n();
  const { session } = useAuth();
  const L = lang === "en";

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  // If user is authenticated, redirect to their latest real plan instead of using localStorage
  useEffect(() => {
    if (!session?.user) return; // guests keep demo behavior

    (async () => {
      try {
        if (import.meta.env.DEV) {
          console.log('🔍 SetupDone: Authenticated user, checking for real plans');
        }
        
        // resolve latest household for this user (owner/member)
        const { data: hhList, error: hhErr } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (hhErr || !hhList?.length) {
          if (import.meta.env.DEV) {
            console.log('⚠️ SetupDone: No household found for user');
          }
          return;
        }

        const householdId = hhList[0].household_id;

        // get most-recent plan week_start for this household
        const { data: planList } = await supabase
          .from("plans")
          .select("week_start")
          .eq("household_id", householdId)
          .order("week_start", { ascending: false })
          .limit(1);

        if (planList?.[0]?.week_start) {
          const realPlanRoute = `/plan/${householdId}-${planList[0].week_start}`;
          if (import.meta.env.DEV) {
            console.log('🎯 SetupDone: Redirecting to real plan:', realPlanRoute);
          }
          navigate(realPlanRoute);
        }
      } catch (error) {
        console.error('❌ SetupDone: Error checking for real plans:', error);
      }
    })();
  }, [session?.user, navigate]);

  const weekStartStr = plan?.week_start as string | undefined;
  const fairness = plan?.fairness ?? 0;
  const occurrences = plan?.occurrences ?? 0;
  const planId = plan?.plan_id as string | undefined;

  const googleCalUrl = useMemo(() => {
    if (!weekStartStr) return "#";
    const start = `${toYmd(weekStartStr)}T000000`;
    const endDate = new Date(weekStartStr);
    endDate.setDate(endDate.getDate() + 7);
    const end = `${toYmd(endDate.toISOString().slice(0,10))}T235900`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: L ? "Household chores week plan" : "Weekplan huishoudtaken",
      dates: `${start}/${end}`,
      details: L ? "Automatically generated weekly plan" : "Automatisch gegenereerd weekplan",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [weekStartStr]);

  const downloadIcs = () => {
    if (!weekStartStr || !planId) return;
    const start = `${toYmd(weekStartStr)}T000000`;
    const endDate = new Date(weekStartStr);
    endDate.setDate(endDate.getDate() + 7);
    const end = `${toYmd(endDate.toISOString().slice(0,10))}T235900`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Chore Dutch//Planner//NL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${planId}@choredutch` ,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=Europe/Amsterdam:${start}`,
      `DTEND;TZID=Europe/Amsterdam:${end}`,
      `SUMMARY:${t('done.icsSummary')}`,
      `DESCRIPTION:${t('done.icsDescription')}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekplan-${weekStartStr}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("done_cta_clicked", { cta_id: "calendar" });
  };

  const copyInvite = async () => {
    if (!planId) return;
    const link = `${location.origin}/plan/${planId}?invite=1`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: t('done.inviteCopiedTitle'), description: t('done.inviteCopiedDesc') });
      track("invite_sent", { channel: "link" });
    } catch {}
  };

  const restart = () => {
    localStorage.removeItem("setupDraftV2");
    localStorage.removeItem("lastPlanResponse");
    localStorage.removeItem("webhook_log");
    localStorage.removeItem("analytics_log");
    navigate("/setup/1");
  };

  return (
    <main>
      <Helmet>
        <title>{t('done.metaTitle')}</title>
        <meta name="description" content={t('done.metaDescription')} />
        <link rel="canonical" href="/setup/done" />
      </Helmet>

      <section className="container py-8 space-y-6">
        {!plan ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('done.noPlanTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t('done.noPlanDesc')}</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/setup/1")}>{t('done.startWizard')}</Button>
                <Button variant="secondary" onClick={() => navigate("/")}>{t('done.backHome')}</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <article className="space-y-4">
            <header className="space-y-2">
              <h1 ref={h1Ref} tabIndex={-1} className="text-3xl font-bold outline-none">{t('done.h1')}</h1>
              <p className="text-muted-foreground" aria-live="polite">{t('done.successPrefix')} {new Date(weekStartStr!).toLocaleDateString(L ? 'en-GB' : 'nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })} {t('done.successSuffix')}</p>
            </header>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {t('done.overview')}
                  <Badge variant="secondary" aria-label={L ? `Fairness ${fairness} out of 100` : `Eerlijkheid ${fairness} uit 100`}>{L ? 'Fairness' : 'Eerlijkheid'}: {fairness}/100</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {t('done.fairnessLabel')}: {fairness}/100 · {t('done.tasksLabel')}: {occurrences} · {t('done.planIdLabel')}: {planId} · {t('done.weekStartLabel')}: {new Date(weekStartStr!).toLocaleDateString(L ? 'en-GB' : 'nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => { track("done_cta_clicked", { cta_id: "open_plan" }); navigate(`/plan/${planId}`); }}>{t('done.openPlan')}</Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" onClick={() => track("done_cta_clicked", { cta_id: "invite" })}>{t('done.invitePartner')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('done.invitePartner')}</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">{t('done.inviteCopiedDesc')}</p>
                      <div className="flex gap-2">
                        <Button onClick={copyInvite}>{t('done.inviteCopiedTitle')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="secondary" onClick={() => { track("done_cta_clicked", { cta_id: "notifications" }); navigate("/setup/2"); }}>{t('done.notifications')}</Button>

                  <Button variant="secondary" onClick={downloadIcs}>{t('done.addToCalendar')}</Button>

                  <a href={googleCalUrl} target="_blank" rel="noreferrer" onClick={() => track("done_cta_clicked", { cta_id: "calendar_gcal" })}>
                    <Button variant="outline">{t('done.openGcal')}</Button>
                  </a>

                  <Button variant="outline" onClick={() => { window.print(); track("done_cta_clicked", { cta_id: "print" }); }}>Print / Download</Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => track("done_cta_clicked", { cta_id: "why_fair" })}>{t('done.whyThis')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('done.whyTitle')}</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">{t('done.whyBody')}</p>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => { track("done_cta_clicked", { cta_id: "back_home" }); navigate("/"); }}>{t('done.backHome')}</Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" onClick={() => track("done_cta_clicked", { cta_id: "restart" })}>{t('done.restart')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('done.restartConfirmTitle')}</AlertDialogTitle>
                      </AlertDialogHeader>
                      <p className="text-sm text-muted-foreground">{t('done.restartConfirmBody')}</p>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('done.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={restart}>{t('done.restartConfirmAction')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </article>
        )}
      </section>
    </main>
  );
};

export default SetupDone;
