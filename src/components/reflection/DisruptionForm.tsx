import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { DisruptionType, Disruption } from "@/types/disruptions";
import { DISRUPTION_LABELS } from "@/types/disruptions";
import type { Person } from "@/types/models";

interface DisruptionFormProps {
  weekStart: string;
  people: Person[];
  onSubmit: (disruptions: Partial<Disruption>[]) => void;
  onCancel: () => void;
}

interface FormData {
  selectedTypes: DisruptionType[];
  affectedPersonIds: string[];
  nightsImpacted: number;
  notes: string;
  consentToAdjust: boolean;
}

export function DisruptionForm({ weekStart, people, onSubmit, onCancel }: DisruptionFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    selectedTypes: [],
    affectedPersonIds: [],
    nightsImpacted: 0,
    notes: "",
    consentToAdjust: false
  });

  const handleTypeToggle = (type: DisruptionType) => {
    setFormData(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type]
    }));
  };

  const handlePersonToggle = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      affectedPersonIds: prev.affectedPersonIds.includes(personId)
        ? prev.affectedPersonIds.filter(id => id !== personId)
        : [...prev.affectedPersonIds, personId]
    }));
  };

  const handleSubmit = () => {
    const disruptions = formData.selectedTypes.map(type => ({
      week_start: weekStart,
      type,
      affected_person_ids: formData.affectedPersonIds,
      nights_impacted: formData.nightsImpacted,
      notes: formData.notes,
      consent_a: formData.consentToAdjust,
      consent_b: formData.consentToAdjust // Simplified for now
    }));
    
    onSubmit(disruptions);
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return formData.selectedTypes.length > 0 && formData.affectedPersonIds.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Weekly Reflection</h2>
          <span className="text-sm text-muted-foreground">Step {step} of 3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">What disrupted your routine this week?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(DISRUPTION_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={formData.selectedTypes.includes(type as DisruptionType)}
                    onCheckedChange={() => handleTypeToggle(type as DisruptionType)}
                  />
                  <Label htmlFor={type} className="text-sm">{label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Who was affected?</h3>
            <div className="flex gap-3">
              {people.map(person => (
                <div key={person.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={person.id}
                    checked={formData.affectedPersonIds.includes(person.id)}
                    onCheckedChange={() => handlePersonToggle(person.id)}
                  />
                  <Label htmlFor={person.id}>{person.first_name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              How many evenings/days did this affect? ({formData.nightsImpacted})
            </Label>
            <Slider
              value={[formData.nightsImpacted]}
              onValueChange={([value]) => setFormData(prev => ({ ...prev, nightsImpacted: value }))}
              max={7}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>7</span>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Additional notes (optional)</h3>
            <Textarea
              placeholder="Any additional details about what happened this week..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Apply learnings for next week</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Based on your disruptions, we'll automatically suggest lighter evening loads and backup options.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="consent" className="font-medium">
                Consent to fairness adjust?
              </Label>
              <p className="text-sm text-muted-foreground">
                Both partners agree to not penalize for disruption-related missed tasks
              </p>
            </div>
            <Switch
              id="consent"
              checked={formData.consentToAdjust}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consentToAdjust: checked }))}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">For next week, we'll:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {formData.selectedTypes.includes('overtime') && (
                <li>• Reduce evening load on work-heavy days</li>
              )}
              {formData.selectedTypes.includes('sick_child') && (
                <li>• Add backup options for childcare tasks</li>
              )}
              {formData.nightsImpacted > 2 && (
                <li>• Avoid stacking 3+ tasks on busy evenings</li>
              )}
              <li>• Shift flexible tasks to less disrupted days</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
          disabled={!canContinue()}
        >
          {step === 3 ? 'Apply & Generate Plan' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}