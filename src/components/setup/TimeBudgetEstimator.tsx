import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  personName: string;
  initialMinutes?: number;
  onApply: (minutes: number) => void;
};

export default function TimeBudgetEstimator({ open, onOpenChange, personName, initialMinutes = 60, onApply }: Props) {
  const { t } = useI18n();
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
          <DialogTitle>{t("setupFlow.timeEstimator.title").replace("{name}", personName)}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("setupFlow.timeEstimator.subtitle")}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Evenings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t("setupFlow.timeEstimator.evenings")}</Label>
              <span className="text-sm text-muted-foreground">{evenings} {t("setupFlow.timeEstimator.eveningsUnit")}</span>
            </div>
            <Slider value={[evenings]} min={0} max={5} step={1} onValueChange={([v]) => setEvenings(v)} />
            <p className="text-xs text-muted-foreground mt-1">≈ {evenings * 30} min</p>
          </div>

          {/* Mornings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t("setupFlow.timeEstimator.mornings")}</Label>
              <span className="text-sm text-muted-foreground">{mornings}</span>
            </div>
            <Slider value={[mornings]} min={0} max={5} step={1} onValueChange={([v]) => setMornings(v)} />
            <p className="text-xs text-muted-foreground mt-1">≈ {mornings * 10} min</p>
          </div>

          {/* Weekend blocks */}
          <div>
            <Label className="mb-2 block">{t("setupFlow.timeEstimator.weekendBlocks")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <ToggleRow label={t("setupFlow.timeEstimator.satMorning")} checked={wkZaAm} onChange={setZaAm} />
              <ToggleRow label={t("setupFlow.timeEstimator.satAfternoon")} checked={wkZaPm} onChange={setZaPm} />
              <ToggleRow label={t("setupFlow.timeEstimator.sunMorning")} checked={wkZoAm} onChange={setZoAm} />
              <ToggleRow label={t("setupFlow.timeEstimator.sunAfternoon")} checked={wkZoPm} onChange={setZoPm} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("setupFlow.timeEstimator.blocksResult").replace("{count}", weekendBlocks.toString()).replace("{minutes}", (weekendBlocks * 60).toString())}</p>
          </div>

          {/* Week type */}
          <div className="space-y-2">
            <Label>{t("setupFlow.timeEstimator.weekType")}</Label>
            <div className="flex gap-2">
              <Choice label={t("setupFlow.timeEstimator.light")} selected={busy==="light"} onClick={() => setBusy("light")} />
              <Choice label={t("setupFlow.timeEstimator.normal")} selected={busy==="normal"} onClick={() => setBusy("normal")} />
              <Choice label={t("setupFlow.timeEstimator.heavy")} selected={busy==="heavy"} onClick={() => setBusy("heavy")} />
            </div>
          </div>

          {/* Result */}
          <div className="rounded-md border p-3 bg-muted/40">
            <div className="text-sm">{t("setupFlow.timeEstimator.estimate")}</div>
            <div className="text-2xl font-semibold">{total} min / {t("setupFlow.timeEstimator.week")}</div>
            <div className="text-xs text-muted-foreground">
              {t("setupFlow.timeEstimator.calculation").replace("{base}", base.toString()).replace("{modifier}", modifier.toFixed(2))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("setupFlow.timeEstimator.cancel")}</Button>
          <Button onClick={() => { onApply(total); onOpenChange(false); }}>{t("setupFlow.timeEstimator.apply").replace("{minutes}", total.toString())}</Button>
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