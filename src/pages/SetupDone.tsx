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
function useLastPlan() {
  const [plan, setPlan] = useState<null | any>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const fresh = Date.now() - Date.parse(parsed.created_at || 0) < 24 * 60 * 60 * 1000;
      if (fresh) setPlan(parsed);
    } catch {}
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
  const { lang } = useI18n();
  const L = lang === "en";

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

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
      "SUMMARY:Weekplan huishoudtaken",
      "DESCRIPTION:Automatisch gegenereerd weekplan",
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
      toast({ title: "Uitnodiging gekopieerd", description: "Stuur de link naar je partner." });
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
        <title>Weekplan aangemaakt | Huishouden</title>
        <meta name="description" content="Je weekplan is aangemaakt. Bekijk details en volgende stappen." />
        <link rel="canonical" href="/setup/done" />
      </Helmet>

      <section className="container py-8 space-y-6">
        {!plan ? (
          <Card>
            <CardHeader>
              <CardTitle>Geen plan gevonden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Begin bij stap 1 om een nieuw weekplan te maken.</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/setup/1")}>Start wizard</Button>
                <Button variant="secondary" onClick={() => navigate("/")}>Terug naar start</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <article className="space-y-4">
            <header className="space-y-2">
              <h1 ref={h1Ref} tabIndex={-1} className="text-3xl font-bold outline-none">Weekplan aangemaakt 🎉</h1>
              <p className="text-muted-foreground" aria-live="polite">Je plan voor week vanaf {formatDate(weekStartStr!)} is klaar.</p>
            </header>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  Planoverzicht
                  <Badge variant="secondary" aria-label={`Eerlijkheid ${fairness} uit 100`}>Eerlijkheid: {fairness}/100</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Eerlijkheid: {fairness}/100 · Taken: {occurrences} · Plan-ID: {planId} · Week start: {formatDate(weekStartStr!)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => { track("done_cta_clicked", { cta_id: "open_plan" }); navigate(`/plan/${planId}`); }}>Open weekplan</Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" onClick={() => track("done_cta_clicked", { cta_id: "invite" })}>Partner uitnodigen</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Partner uitnodigen</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">Kopieer de uitnodigingslink en deel deze met je partner. Toestemming voor meldingen kun je instellen bij de personen.</p>
                      <div className="flex gap-2">
                        <Button onClick={copyInvite}>Kopieer uitnodigingslink</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="secondary" onClick={() => { track("done_cta_clicked", { cta_id: "notifications" }); navigate("/setup/2"); }}>Meldingen instellen</Button>

                  <Button variant="secondary" onClick={downloadIcs}>Toevoegen aan agenda</Button>

                  <a href={googleCalUrl} target="_blank" rel="noreferrer" onClick={() => track("done_cta_clicked", { cta_id: "calendar_gcal" })}>
                    <Button variant="outline">Open in Google Calendar</Button>
                  </a>

                  <Button variant="outline" onClick={() => { window.print(); track("done_cta_clicked", { cta_id: "print" }); }}>Print / Download</Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => track("done_cta_clicked", { cta_id: "why_fair" })}>Waarom deze verdeling?</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Over eerlijkheid</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">De eerlijkheidsscore vergelijkt de werkbelasting per volwassene met de ingestelde tijdsbudgetten en taakvoorkeuren. Het doel is een gebalanceerde verdeling die ook praktisch uitvoerbaar is.</p>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => { track("done_cta_clicked", { cta_id: "back_home" }); navigate("/"); }}>Terug naar start</Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" onClick={() => track("done_cta_clicked", { cta_id: "restart" })}>Opnieuw beginnen</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <p className="text-sm text-muted-foreground">Dit verwijdert je concept en het laatst aangemaakte plan van dit apparaat.</p>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction onClick={restart}>Ja, verwijder en opnieuw beginnen</AlertDialogAction>
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
