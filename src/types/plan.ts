export type FairnessAdult = {
  person_id: string
  actual_minutes: number
  actual_points: number
  target_minutes: number
  target_points: number
  actual_share: number
  target_share: number
  delta_minutes: number
  delta_share: number
}

export type FairnessDetails = {
  adults: FairnessAdult[]
  contributors: {
    evenings_over_cap: Record<string, number>
    stacking_violations: Record<string, number>
    disliked_assignments: Record<string, number>
  }
}