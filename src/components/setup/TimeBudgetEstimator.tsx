import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  personName: string;
  initialMinutes?: number;
  onApply: (minutes: number) => void;
};

export default function TimeBudgetEstimator({ open, onOpenChange, personName, initialMinutes = 60, onApply }: Props) {
  const [evenings, setEvenings] = useState(2);        // 0..5
  const [mornings, setMornings] = useState(1);        // 0..5
  const [wkZaAm, setZaAm] = useState(false);
  const [wkZaPm, setZaPm] = useState(true);
  const [wkZoAm, setZoAm] = useState(false);
  const [wkZoPm, setZoPm] = useState(false);
  const [busy, setBusy] = useState<"light"|"normal"|"heavy">("normal");

  const weekendBlocks = [wkZaAm, wkZaPm, wkZoAm, wkZoPm].filter(Boolean).length;

  const base = useMemo(() => (evenings * 30) + (mornings * 10) + (weekendBlocks * 60), [evenings, mornings, weekendBlocks]);
  const modifier = busy === "light" ? 0.8 : busy === "heavy" ? 1.2 : 1.0;
  const total = Math.round(base * modifier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Snelle schatting voor {personName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Beantwoord een paar korte vragen. We vullen je weekminuten automatisch in.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Evenings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Avonden beschikbaar (ma–vr)</Label>
              <span className="text-sm text-muted-foreground">{evenings} avond(en)</span>
            </div>
            <Slider value={[evenings]} min={0} max={5} step={1} onValueChange={([v]) => setEvenings(v)} />
            <p className="text-xs text-muted-foreground mt-1">≈ {evenings * 30} min</p>
          </div>

          {/* Mornings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ochtenden met 10 minuten over</Label>
              <span className="text-sm text-muted-foreground">{mornings}</span>
            </div>
            <Slider value={[mornings]} min={0} max={5} step={1} onValueChange={([v]) => setMornings(v)} />
            <p className="text-xs text-muted-foreground mt-1">≈ {mornings * 10} min</p>
          </div>

          {/* Weekend blocks */}
          <div>
            <Label className="mb-2 block">Weekendblokken (60 min)</Label>
            <div className="grid grid-cols-2 gap-3">
              <ToggleRow label="Zaterdag ochtend" checked={wkZaAm} onChange={setZaAm} />
              <ToggleRow label="Zaterdag middag"  checked={wkZaPm} onChange={setZaPm} />
              <ToggleRow label="Zondag ochtend"   checked={wkZoAm} onChange={setZoAm} />
              <ToggleRow label="Zondag middag"    checked={wkZoPm} onChange={setZoPm} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Blokken: {weekendBlocks} → ≈ {weekendBlocks * 60} min</p>
          </div>

          {/* Week type */}
          <div className="space-y-2">
            <Label>Weektype</Label>
            <div className="flex gap-2">
              <Choice label="Licht (-20%)" selected={busy==="light"} onClick={() => setBusy("light")} />
              <Choice label="Normaal" selected={busy==="normal"} onClick={() => setBusy("normal")} />
              <Choice label="Druk (+20%)" selected={busy==="heavy"} onClick={() => setBusy("heavy")} />
            </div>
          </div>

          {/* Result */}
          <div className="rounded-md border p-3 bg-muted/40">
            <div className="text-sm">Schatting</div>
            <div className="text-2xl font-semibold">{total} min / week</div>
            <div className="text-xs text-muted-foreground">
              Basis {base} × {modifier.toFixed(2)} (weektype)
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={() => { onApply(total); onOpenChange(false); }}>Gebruik {total} min</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v:boolean)=>void }) {
  return (
    <label className="flex items-center justify-between rounded-md border p-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick:()=>void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md border text-sm ${selected ? "bg-primary text-primary-foreground" : "bg-background"}`}
    >
      {label}
    </button>
  );
}