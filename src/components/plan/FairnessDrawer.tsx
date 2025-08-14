import React from "react";
import { X } from "lucide-react";
import type { FairnessDetails } from "@/types/plan";

export function FairnessDrawer({
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
  
  return (
    <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background p-6 overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Eerlijkheid</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          We balanceren werkdrukpunten (minuten × zwaarte) met jullie tijdsbudgetten.
        </p>

        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{score}/100</div>
            <div className="text-sm text-muted-foreground">Eerlijkheidsscore</div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-lg">Verdeling per persoon</h3>
          {adults.map(a => {
            const name = peopleById[a.person_id]?.first_name ?? a.person_id;
            return (
              <div key={a.person_id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="font-medium text-lg">{name}</span>
                  <span className="text-muted-foreground">
                    {Math.round(a.actual_minutes)} min (doel {Math.round(a.target_minutes)} min)
                  </span>
                </div>
                
                <div className="h-3 bg-muted rounded-full relative mb-2">
                  {/* actual bar */}
                  <div 
                    className="h-3 bg-primary rounded-full transition-all" 
                    style={{ width: `${Math.min(a.actual_share * 100, 100)}%` }} 
                  />
                  {/* target marker */}
                  <div 
                    className="absolute top-0 -mt-1 h-5 w-1 bg-blue-500 rounded" 
                    style={{ left: `${Math.min(a.target_share * 100, 100)}%` }} 
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Doel {pct(a.target_share)}%</span>
                  <span>Nu {pct(a.actual_share)}%</span>
                  <span className={a.delta_minutes >= 0 ? "text-orange-600" : "text-green-600"}>
                    Δ {a.delta_minutes >= 0 ? "+" : ""}{a.delta_minutes} min
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contributors section */}
        {details && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Waarom geen 100?</h3>
            <div className="space-y-2">
              {Object.entries(details.contributors.evenings_over_cap).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`cap-${pid}`} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} avond(en) boven limiet</span>
                  </div>
                ) : null
              )}
              {Object.entries(details.contributors.stacking_violations).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`stack-${pid}`} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} drukke avond(en)</span>
                  </div>
                ) : null
              )}
              {Object.entries(details.contributors.disliked_assignments).map(([pid, n]) =>
                n > 0 ? (
                  <div key={`dislike-${pid}`} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>{peopleById[pid]?.first_name ?? pid}: {n} taak/taken die minder leuk zijn</span>
                  </div>
                ) : null
              )}
            </div>
            
            {/* Show message if no contributors */}
            {Object.values(details.contributors.evenings_over_cap).every(n => n === 0) &&
             Object.values(details.contributors.stacking_violations).every(n => n === 0) &&
             Object.values(details.contributors.disliked_assignments).every(n => n === 0) && (
              <p className="text-sm text-muted-foreground italic">
                Geen specifieke knelpunten gevonden. Score kan worden beïnvloed door kleine verschillen in werkdruk.
              </p>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-3">Snelle verbeteringen</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <span>Verhoog het budget van wie onder doel zit met +15 min</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <span>Verlaag de frequentie van de grootste tijdvreter</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <span>Ruil één avondtaak met je partner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}