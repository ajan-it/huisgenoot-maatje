import type { Disruption, DisruptionType } from "@/types/disruptions";
import type { FairnessAdult } from "@/types/plan";

export interface EnhancedFairnessDetails {
  adults: FairnessAdult[];
  contributors: {
    evenings_over_cap: Record<string, number>;
    stacking_violations: Record<string, number>;
    disliked_assignments: Record<string, number>;
    pair_not_rotated: Record<string, number>;
    disruption_adjustments: Record<string, number>;
  };
  disruptions_this_week: DisruptionSummary[];
  reliability_scores: Record<string, ReliabilityScore>;
}

export interface DisruptionSummary {
  type: DisruptionType;
  affected_persons: string[];
  nights_impacted: number;
  fairness_adjusted: boolean;
}

export interface ReliabilityScore {
  overall: number;
  by_category: Record<string, number>;
  critical_task_completion: number;
  boost_effectiveness: number;
}

export function adjustFairnessForDisruptions(
  fairnessScore: number,
  adults: FairnessAdult[],
  disruptions: Disruption[]
): { adjustedScore: number; adjustedAdults: FairnessAdult[]; adjustments: Record<string, number> } {
  const adjustments: Record<string, number> = {};
  const adjustedAdults = [...adults];

  // Apply disruption adjustments
  disruptions.forEach(disruption => {
    if (disruption.consent_a && disruption.consent_b) {
      const adjustmentPerNight = 5; // 5 points per disrupted night
      const totalAdjustment = adjustmentPerNight * disruption.nights_impacted;
      
      disruption.affected_person_ids.forEach(personId => {
        const adultIndex = adjustedAdults.findIndex(a => a.person_id === personId);
        if (adultIndex >= 0) {
          // Reduce the person's "penalty" for being over their target
          if (adjustedAdults[adultIndex].delta_share > 0) {
            const reduction = Math.min(adjustedAdults[adultIndex].delta_share, totalAdjustment / 100);
            adjustedAdults[adultIndex].delta_share -= reduction;
            adjustments[personId] = (adjustments[personId] || 0) + reduction * 100;
          }
        }
      });
    }
  });

  // Recalculate fairness score based on adjusted deltas
  const totalDelta = adjustedAdults.reduce((sum, adult) => sum + Math.abs(adult.delta_share), 0);
  const adjustedScore = Math.max(0, Math.min(100, 100 - (totalDelta * 100)));

  return {
    adjustedScore,
    adjustedAdults,
    adjustments
  };
}

export function calculateReliabilityScores(
  personId: string,
  boostLogs: any[], // BoostLog[]
  occurrences: any[] // Occurrence[]
): ReliabilityScore {
  const personOccurrences = occurrences.filter(o => o.assigned_person === personId);
  const completedTasks = personOccurrences.filter(o => o.status === 'done').length;
  const totalTasks = personOccurrences.length;
  
  const criticalTasks = personOccurrences.filter(o => o.is_critical);
  const completedCritical = criticalTasks.filter(o => o.status === 'done').length;
  
  const boostInteractions = boostLogs.filter(log => log.person_id === personId);
  const successfulBoosts = boostInteractions.filter(log => 
    log.interaction === 'acknowledged' || log.interaction === 'completed'
  ).length;

  return {
    overall: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100,
    by_category: {}, // Would need task categories to calculate
    critical_task_completion: criticalTasks.length > 0 ? (completedCritical / criticalTasks.length) * 100 : 100,
    boost_effectiveness: boostInteractions.length > 0 ? (successfulBoosts / boostInteractions.length) * 100 : 100
  };
}

export function generatePlanningAdjustments(disruptions: Disruption[]): PlanningAdjustment[] {
  const adjustments: PlanningAdjustment[] = [];

  disruptions.forEach(disruption => {
    switch (disruption.type) {
      case 'overtime':
      case 'late_shifts':
        adjustments.push({
          type: 'reduce_evening_load',
          affected_persons: disruption.affected_person_ids,
          days: ['tuesday', 'wednesday', 'thursday'], // Typical work heavy days
          reduction_percent: 30
        });
        break;
        
      case 'sick_child':
      case 'childcare_issues':
        adjustments.push({
          type: 'add_backup_for_category',
          category: 'childcare',
          affected_persons: disruption.affected_person_ids,
          backup_preference: true
        });
        break;
        
      case 'commute_delays':
        adjustments.push({
          type: 'avoid_early_morning',
          affected_persons: disruption.affected_person_ids,
          before_time: '08:00'
        });
        break;
        
      case 'low_energy':
      case 'mental_load':
        adjustments.push({
          type: 'reduce_difficulty',
          affected_persons: disruption.affected_person_ids,
          max_difficulty: 2
        });
        break;
    }
  });

  return adjustments;
}

export interface PlanningAdjustment {
  type: 'reduce_evening_load' | 'add_backup_for_category' | 'avoid_early_morning' | 'reduce_difficulty';
  affected_persons: string[];
  category?: string;
  days?: string[];
  reduction_percent?: number;
  backup_preference?: boolean;
  before_time?: string;
  max_difficulty?: number;
}

export function formatDisruptionExplanation(
  disruptions: Disruption[],
  adjustments: Record<string, number>,
  lang: 'en' | 'nl' = 'en'
): string {
  const L = lang === 'en';
  
  if (disruptions.length === 0) return '';
  
  const consentedDisruptions = disruptions.filter(d => d.consent_a && d.consent_b);
  if (consentedDisruptions.length === 0) return '';
  
  const totalAdjustment = Object.values(adjustments).reduce((sum, val) => sum + val, 0);
  
  if (L) {
    return `Fairness adjusted by ${Math.round(totalAdjustment)} points due to ${consentedDisruptions.length} agreed disruption${consentedDisruptions.length > 1 ? 's' : ''} this week.`;
  } else {
    return `Eerlijkheid aangepast met ${Math.round(totalAdjustment)} punten vanwege ${consentedDisruptions.length} overeengekomen verstoring${consentedDisruptions.length > 1 ? 'en' : ''} deze week.`;
  }
}