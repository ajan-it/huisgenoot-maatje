import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

interface RebalanceChange {
  type: 'swap' | 'move';
  fromPerson: string;
  toPerson: string;
  task: string;
  date: string;
}

interface RebalancePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFairness: number;
  projectedFairness: number;
  changes: RebalanceChange[];
  adults: Array<{
    id: string;
    name: string;
    currentMinutes: number;
    projectedMinutes: number;
    targetMinutes: number;
  }>;
  onApply: () => Promise<void>;
  onCancel: () => void;
}

export function RebalancePreview({
  open,
  onOpenChange,
  currentFairness,
  projectedFairness,
  changes,
  adults,
  onApply,
  onCancel
}: RebalancePreviewProps) {
  const [isApplying, setIsApplying] = useState(false);
  const { lang } = useI18n();
  const L = lang === "en";

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to apply rebalance:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const improvementPoints = projectedFairness - currentFairness;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {L ? "Fairness Improvements" : "Eerlijkheidsverbeteringen"}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              +{improvementPoints} {L ? "points" : "punten"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fairness Score Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {L ? "Fairness Score" : "Eerlijkheidsscore"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{currentFairness}</div>
                  <div className="text-xs text-muted-foreground">{L ? "Current" : "Huidige"}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{projectedFairness}</div>
                  <div className="text-xs text-muted-foreground">{L ? "Projected" : "Voorspeld"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposed Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {L ? "Proposed Changes" : "Voorgestelde Wijzigingen"} ({changes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {changes.map((change, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{change.task}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(change.date).toLocaleDateString(L ? "en-GB" : "nl-NL", { 
                        weekday: "short", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{change.fromPerson}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium">{change.toPerson}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Workload Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {L ? "Workload Impact" : "Werklastimpact"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {adults.map((adult) => {
                const currentProgress = (adult.currentMinutes / adult.targetMinutes) * 100;
                const projectedProgress = (adult.projectedMinutes / adult.targetMinutes) * 100;
                const delta = adult.projectedMinutes - adult.currentMinutes;
                
                return (
                  <div key={adult.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{adult.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{adult.currentMinutes}min</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className={delta > 0 ? "text-orange-600" : delta < 0 ? "text-green-600" : ""}>
                          {adult.projectedMinutes}min
                        </span>
                        {delta !== 0 && (
                          <Badge variant="outline" className={`text-xs ${
                            delta > 0 ? "text-orange-600 border-orange-200" : "text-green-600 border-green-200"
                          }`}>
                            {delta > 0 ? "+" : ""}{delta}min
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Progress value={currentProgress} className="h-2 flex-1 opacity-50" />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Progress value={projectedProgress} className="h-2 flex-1" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleApply} 
              disabled={isApplying}
              className="flex-1"
            >
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {L ? "Apply Changes" : "Wijzigingen Toepassen"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isApplying}
            >
              {L ? "Cancel" : "Annuleren"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}