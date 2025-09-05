# Task Overrides System

## Overview

The task overrides system allows household members to temporarily or permanently modify their task plan without changing the underlying task templates. This provides flexibility while maintaining the integrity of the baseline planning system.

## Scope Types

Task overrides support five different scope types with the following precedence order (highest to lowest):

### 1. Once (Highest Precedence)
- **Description**: Applies only to a single occurrence
- **Use Case**: "Skip today's daycare drop-off because grandma is doing it"
- **Duration**: Single occurrence only
- **Example**: Remove bathroom cleaning for this Saturday only

### 2. Week
- **Description**: Applies to the current week
- **Use Case**: "We're going on vacation this week, skip all cleaning tasks"
- **Duration**: Monday to Sunday of the target week
- **Example**: Exclude meal planning for the week of March 15th

### 3. Month
- **Description**: Applies to the entire month
- **Use Case**: "Try groceries twice per week for the month of April"
- **Duration**: First day to last day of the target month
- **Example**: Change laundry frequency to twice weekly for March

### 4. Snooze
- **Description**: Applies until a specific future date
- **Use Case**: "Kids are sick, snooze meal planning until Sunday"
- **Duration**: From now until the specified date
- **Example**: Snooze all evening tasks until next Tuesday

### 5. Always (Lowest Precedence)
- **Description**: Applies indefinitely until manually removed
- **Use Case**: "Add chimney cleaning as a yearly task"
- **Duration**: Ongoing, appears in all future plans
- **Example**: Include seasonal gutter cleaning every fall

## Actions

### Include
- Adds a task to the plan even if it's normally inactive
- Useful for one-time tasks or seasonal activities
- Can specify custom frequency for the override period

### Exclude
- Removes a task from the plan for the specified scope
- Most common action for temporary breaks
- Automatically recalculates fairness distribution

### Frequency Change
- Modifies how often a task occurs during the override period
- Original task template remains unchanged
- Returns to original frequency after override expires

## Precedence Rules

When multiple overrides affect the same task:

1. **Higher scope always wins**: Once > Week > Month > Snooze > Always
2. **Same scope, latest wins**: Most recent override takes precedence
3. **Idempotent operations**: Identical overrides are deduplicated

## Undo System

### 30-Second Undo Window
- All override actions show an undo pill for 30 seconds
- Clicking "Undo" deletes the override and regenerates the plan
- Automatic dismissal after 30 seconds

### Undo Behavior
- Deletes the override record from the database
- Re-runs the planner with remaining overrides
- Restores plan to previous state
- Updates fairness calculations

## Fairness Impact

### Threshold Detection
- System calculates point shifts when overrides are applied
- Shows fairness hint when shift exceeds threshold (default: 30 points)
- Offers "Make it Fairer" action to rebalance workload

### Point Calculation
- Points = Duration × Difficulty Weight
- Tracks cumulative impact across all household members
- Provides suggestions for rebalancing when needed

## Technical Implementation

### Database Schema
```sql
CREATE TABLE public.task_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  task_id text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('once','week','month','always','snooze')),
  effective_from date NOT NULL,
  effective_to date NULL,
  action text NOT NULL CHECK (action IN ('include','exclude','frequency_change')),
  frequency text NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Override Processing
1. Load all overrides that intersect the requested date range
2. Sort by precedence (once > week > month > snooze > always)
3. Apply actions in precedence order
4. Generate occurrences with overrides applied
5. Calculate and return diff summary

### Data Integrity
- Row Level Security ensures household member access only
- Unique constraints prevent duplicate overrides
- Cascade deletes when households are removed
- Audit trail through created_by and created_at fields

## User Experience

### Task Picker Panel
- Global access from any calendar view
- Category and frequency filters
- Bulk selection and actions
- Real-time search

### Scope Menu
- Consistent across all task actions
- Visual date picker for snooze functionality
- Clear labels in multiple languages
- Contextual help text

### Confirmation System
- Immediate visual feedback
- Clear action summary
- Prominent undo option
- Auto-dismiss after timeout

## Best Practices

### For Users
1. Use "Once" for single-day changes
2. Use "Week" for short-term disruptions
3. Use "Month" for trial periods
4. Use "Always" sparingly for permanent additions
5. Use "Snooze" for indefinite delays with known end dates

### For Developers
1. Always check override precedence
2. Validate date ranges for scope
3. Handle edge cases (month boundaries, leap years)
4. Provide clear error messages
5. Log override actions for debugging

## Troubleshooting

### Common Issues
- **Override not applying**: Check date range intersection
- **Unexpected precedence**: Verify scope ordering
- **Missing undo option**: Ensure proper pill component state
- **Fairness miscalculation**: Validate point calculation logic

### Debug Information
- All overrides are logged during plan generation
- Diff summary shows exactly what changed
- Fairness impact tracks point distribution
- Console logs available in development mode