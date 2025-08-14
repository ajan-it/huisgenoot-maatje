import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useI18n } from "@/i18n/I18nProvider";
import { InfoIcon, TrendingUpIcon, UsersIcon, XIcon } from "lucide-react";

interface FairnessDrawerProps {
  fairness: number;
  fairnessDetails?: {
    adults: Array<{
      person_id: string;
      actual_minutes: number;
      target_minutes: number;
      actual_share: number;
      target_share: number;
      delta_minutes: number;
      delta_share: number;
    }>;
    contributors: {
      evenings_over_cap: Record<string, number>;
      stacking_violations: Record<string, number>;
      disliked_assignments: Record<string, number>;
    };
    color: string;
  };
  people: Array<{ id: string; first_name: string }>;
  children: React.ReactNode;
}

export function FairnessDrawer({ fairness, fairnessDetails, people, children }: FairnessDrawerProps) {
  const { lang } = useI18n();
  const L = lang === "en";

  const getPersonName = (personId: string) => {
    return people.find(p => p.id === personId)?.first_name || personId;
  };

  const getFairnessColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getSplitSummary = () => {
    if (!fairnessDetails?.adults || fairnessDetails.adults.length < 2) return "";
    
    const adult1 = fairnessDetails.adults[0];
    const adult2 = fairnessDetails.adults[1];
    
    const targetA = Math.round(adult1.target_share * 100);
    const targetB = Math.round(adult2.target_share * 100);
    const actualA = Math.round(adult1.actual_share * 100);
    const actualB = Math.round(adult2.actual_share * 100);
    
    if (L) {
      return `Target ${targetA}%/${targetB}% • Now ${actualA}%/${actualB}% → ${fairness}/100`;
    } else {
      return `Doel ${targetA}%/${targetB}% • Nu ${actualA}%/${actualB}% → ${fairness}/100`;
    }
  };

  const getContributorIssues = () => {
    if (!fairnessDetails?.contributors) return [];
    
    const issues = [];
    const { evenings_over_cap, stacking_violations, disliked_assignments } = fairnessDetails.contributors;
    
    // Count total issues
    const totalEveningsOver = Object.values(evenings_over_cap).reduce((sum, count) => sum + count, 0);
    const totalStacking = Object.values(stacking_violations).reduce((sum, count) => sum + count, 0);
    const totalDisliked = Object.values(disliked_assignments).reduce((sum, count) => sum + count, 0);
    
    if (totalEveningsOver > 0) {
      issues.push(L ? `${totalEveningsOver} evening(s) over cap` : `${totalEveningsOver} avond(en) boven limiet`);
    }
    
    if (totalStacking > 0) {
      issues.push(L ? `${totalStacking} stacking violation(s)` : `${totalStacking} stapeling(en)`);
    }
    
    if (totalDisliked > 0) {
      issues.push(L ? `${totalDisliked} disliked task assignment(s)` : `${totalDisliked} ongewenste taak toewijzing(en)`);
    }
    
    return issues;
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="flex items-center justify-center gap-2">
            <UsersIcon className="h-5 w-5" />
            {L ? "Fairness Breakdown" : "Eerlijkheid Details"}
          </DrawerTitle>
          <DrawerDescription>
            {L 
              ? "We balance workload points (minutes × difficulty) against your time budgets."
              : "We balanceren werkdrukpunten (minuten × zwaarte) met jullie tijdsbudgetten."
            }
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6">
          {/* Split Summary */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getFairnessColor(fairness)}`}>
              <TrendingUpIcon className="h-4 w-4" />
              {getSplitSummary()}
            </div>
          </div>

          {/* Per-Adult Breakdown */}
          {fairnessDetails?.adults && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {L ? "Per Person" : "Per Persoon"}
              </h3>
              {fairnessDetails.adults.map((adult) => {
                const progress = adult.target_minutes > 0 ? (adult.actual_minutes / adult.target_minutes) * 100 : 0;
                const deltaSign = adult.delta_minutes >= 0 ? "+" : "";
                
                return (
                  <div key={adult.person_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getPersonName(adult.person_id)}</span>
                      <span className="text-muted-foreground">
                        {adult.actual_minutes} {L ? "min" : "min"} 
                        {L ? " (target " : " (doel "}
                        {adult.target_minutes} {L ? "min)" : "min)"}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {deltaSign}{adult.delta_minutes} {L ? "min vs target" : "min t.o.v. doel"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Why Not Higher */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {L ? "Why not 100?" : "Waarom geen 100?"}
            </h3>
            <div className="space-y-2">
              {getContributorIssues().map((issue, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <InfoIcon className="h-3 w-3 flex-shrink-0" />
                  {issue}
                </div>
              ))}
              {getContributorIssues().length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {L ? "No major issues detected." : "Geen grote problemen gedetecteerd."}
                </div>
              )}
            </div>
          </div>

          {/* Quick Improvements */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {L ? "Quick improvements" : "Snelle verbeteringen"}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-3 w-3 flex-shrink-0" />
                {L ? "Adjust time budgets in setup wizard" : "Pas tijdsbudgetten aan in setup wizard"}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-3 w-3 flex-shrink-0" />
                {L ? "Review task preferences and blackouts" : "Bekijk taakvoorkeuren en blokkades"}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-3 w-3 flex-shrink-0" />
                {L ? "Consider reducing frequency of heavy tasks" : "Overweeg frequentie van zware taken te verlagen"}
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {L ? "Close" : "Sluiten"}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}