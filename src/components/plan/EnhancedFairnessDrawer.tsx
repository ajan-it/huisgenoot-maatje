import React from "react";
import { X, AlertTriangle, Calendar } from "lucide-react";
import type { FairnessDetails } from "@/types/plan";
import { Button } from "@/components/ui/button";

export function EnhancedFairnessDrawer({
  open, onClose, score, details, peopleById
}: {
  open: boolean
  onClose: () => void
  score: number
  details: FairnessDetails | null
  peopleById: Record<string, { first_name: string }>
}) {
  if (!open) return null;
  const adults = details?.adults ?? [];

  const pct = (n: number) => `${Math.round(n * 100)}`;
  
  // Generate evening breakdown (mock data for demo)
  const eveningBreakdown = React.useMemo(() => {
    const breakdown: Record<string, Record<string, number>> = {};
    adults.forEach(adult => {
      breakdown[adult.person_id] = {
        'Mon': Math.random() * 40,
        'Tue': Math.random() * 40,
        'Wed': Math.random() * 40,
        'Thu': Math.random() * 40,
        'Fri': Math.random() * 40,
      };
    });
    return breakdown;
  }, [adults]);

  const getFairnessColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-yellow-600 bg-yellow-100"; 
    return "text-red-600 bg-red-100";
  };

  const getTaskRationale = (task: string) => {
    // Mock rationale mapping
    const rationales = {
      "more_remaining": "Meer tijd beschikbaar dan partner",
      "cap_ok": "Binnen avondlimiet van 40 min",
      "avoid_blackout": "Geen conflict met bloktijden",
      "owner_task": "Eigenaar van deze taak",
      "rotated_pair": "Geroteerde gekoppelde taak",
      "daytime_flex": "Dagflexibiliteit",
      "preference_match": "Past bij voorkeuren",
      "avoid_stacking": "Vermijdt stapeling zelfde avond"
    };
    return rationales[task as keyof typeof rationales] || task;
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-background p-6 overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Eerlijkheidsanalyse</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          We balanceren werkdrukpunten (minuten × zwaarte) met jullie tijdsbudgetten en vermijden avondoverbelasting.
        </p>

        {/* Fairness Score */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 px-3 py-1 rounded-full inline-flex items-center gap-2 ${getFairnessColor(score)}`}>
              {score}/100
              {score < 85 && <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="text-sm text-muted-foreground">Eerlijkheidsscore</div>
          </div>
        </div>

        {/* Target vs Actual Split */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Verdeling per persoon
          </h3>
          {adults.map(a => {
            const name = peopleById[a.person_id]?.first_name ?? a.person_id;
            const isOverTarget = a.actual_share > a.target_share;
            return (
              <div key={a.person_id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="font-medium text-lg">{name}</span>
                  <span className="text-muted-foreground">
                    {Math.round(a.actual_minutes)} min (doel {Math.round(a.target_minutes)} min)
                  </span>
                </div>
                
                <div className="h-4 bg-muted rounded-full relative mb-3">
                  {/* actual bar */}
                  <div 
                    className={`h-4 rounded-full transition-all ${isOverTarget ? 'bg-orange-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(a.actual_share * 100, 100)}%` }} 
                  />
                  {/* target marker */}
                  <div 
                    className="absolute top-0 -mt-1 h-6 w-1 bg-blue-600 rounded" 
                    style={{ left: `${Math.min(a.target_share * 100, 100)}%` }} 
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Doel {pct(a.target_share)}%</span>
                  <span>Nu {pct(a.actual_share)}%</span>
                  <span className={a.delta_minutes >= 0 ? "text-orange-600" : "text-green-600"}>
                    Δ {a.delta_minutes >= 0 ? "+" : ""}{Math.round(a.delta_minutes)} min
                  </span>
                </div>

                {/* Evening breakdown mini bars */}
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Avonden (ma-vr):</div>
                  <div className="flex gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
                      const minutes = eveningBreakdown[a.person_id]?.[day] || 0;
                      const isOverCap = minutes > 40;
                      return (
                        <div key={day} className="flex-1 text-center">
                          <div className={`h-2 rounded ${isOverCap ? 'bg-red-400' : 'bg-green-400'}`} 
                               style={{ opacity: Math.min(minutes / 40, 1) }} />
                          <div className="text-xs mt-1">{day.slice(0, 2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contributors section */}
        {details && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Waarom geen 100?</h3>
            <div className="space-y-3">
              {Object.entries(details.contributors.evenings_over_cap).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`cap-${pid}`} className="flex items-center gap-3 text-sm p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} avond(en) boven 40min limiet</span>
                  </div>
                ) : null
              )}
              {Object.entries(details.contributors.stacking_violations).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`stack-${pid}`} className="flex items-center gap-3 text-sm p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} drukke avond(en) (3+ taken)</span>
                  </div>
                ) : null
              )}
              {Object.entries(details.contributors.pair_not_rotated || {}).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`pair-${pid}`} className="flex items-center gap-3 text-sm p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} niet-geroteerde gekoppelde taken</span>
                  </div>
                ) : null
              )}
              {Object.entries(details.contributors.disliked_assignments).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`dislike-${pid}`} className="flex items-center gap-3 text-sm p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} taak/taken die minder leuk zijn</span>
                  </div>
                ) : null
              )}
            </div>
            
            {/* Show message if no contributors */}
            {Object.values(details.contributors.evenings_over_cap).every(n => n === 0) &&
             Object.values(details.contributors.stacking_violations).every(n => n === 0) &&
             Object.values(details.contributors.disliked_assignments).every(n => n === 0) &&
             Object.values(details.contributors.pair_not_rotated || {}).every(n => n === 0) && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  🎉 Geen specifieke knelpunten gevonden! Score wordt vooral bepaald door kleine verschillen in werkdruk.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick improvements */}
        <div className="border-t pt-4 mb-6">
          <h3 className="font-semibold text-lg mb-3">Snelle verbeteringen</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span>Verhoog het budget van wie onder doel zit met +15 min</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span>Verlaag de frequentie van de grootste tijdvreter</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span>Ruil één avondtaak met je partner</span>
            </div>
          </div>
        </div>

        {/* Rationale explanations */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">Waarom ik?</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Veelgebruikte redenen voor taaktoewijzing:</p>
            {[
              "more_remaining",
              "cap_ok", 
              "avoid_blackout",
              "owner_task",
              "rotated_pair",
              "daytime_flex"
            ].map(reason => (
              <div key={reason} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>{getTaskRationale(reason)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}