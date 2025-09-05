# User Story Tests - Task Overrides

This document outlines test scenarios for the five key user stories in the task overrides feature.

## Story 1: "We're invited out, skip chores just this week"

### Test Scenario
1. Navigate to Calendar → Month view
2. Find "Weekly Clean" task on Saturday
3. Click task menu → Remove → Scope: This week
4. Verify task disappears from current week
5. Check fairness hint shows "~40 pts shift to Partner B. Rebalance?"
6. Confirm pill shows "Removed Weekly Clean this week. Undo"

### Expected Results
- ✅ Task removed only for current week
- ✅ Next week still shows the task
- ✅ Fairness hint appears if points > 30
- ✅ Undo button available for 30 seconds
- ✅ Plan regeneration respects the override

### API Test
```javascript
// Test override creation
const override = {
  household_id: "uuid",
  task_id: "weekly-clean",
  scope: "week",
  action: "exclude",
  effective_from: "2024-03-11", // Monday of target week
  effective_to: "2024-03-17"    // Sunday of target week
}

// Verify precedence: week override beats always override
```

## Story 2: "Kids are sick; snooze meal plan until Sunday"

### Test Scenario
1. Open task drawer for "Meal plan & list"
2. Choose Snooze until… → Select next Sunday
3. Verify all occurrences before Sunday are removed
4. Check pill shows "Snoozed until Sun. Undo"

### Expected Results
- ✅ Occurrences before snooze date suppressed
- ✅ Occurrences after snooze date remain
- ✅ Fairness impact calculated correctly
- ✅ Undo reverses the snooze

### API Test
```javascript
// Test snooze override
const snoozeOverride = {
  scope: "snooze",
  action: "exclude", 
  effective_from: "2024-03-12",
  effective_to: "2024-03-17"
}

// Verify date range filtering works correctly
```

## Story 3: "Make chimney sweep a yearly thing (always)"

### Test Scenario
1. Open Task Picker → Seasonal/Yearly section
2. Add "Chimney sweep" with Scope: Always (frequency: yearly, November)
3. Verify it appears in Year view for November
4. Check pill "Added Chimney sweep (yearly). Undo"

### Expected Results
- ✅ Task appears in all future year plans
- ✅ Original template remains unchanged
- ✅ Override stored in database with scope: "always"
- ✅ Frequency change respected

### API Test
```javascript
// Test always override with frequency change
const alwaysOverride = {
  scope: "always",
  action: "include",
  frequency: "yearly",
  effective_from: "2024-01-01"
  // no effective_to for always scope
}
```

## Story 4: "Skip daycare drop-off today (only once)"

### Test Scenario
1. Navigate to Day view for Wednesday
2. Find "Daycare drop-off" task
3. Remove → Only this time
4. Verify only today's occurrence removed
5. Check other weekdays untouched

### Expected Results
- ✅ Single occurrence removed
- ✅ Other days of week unaffected
- ✅ ROTATE/TOGETHER modes respect credit removal
- ✅ Fairness calculated for single task

### API Test
```javascript
// Test once override
const onceOverride = {
  scope: "once",
  action: "exclude",
  effective_from: "2024-03-13", // specific Wednesday
  effective_to: "2024-03-13"    // same day
}

// Verify highest precedence
```

## Story 5: "One month trial: groceries twice a week"

### Test Scenario
1. Navigate to Calendar → Month view
2. Find "Groceries" task
3. Change frequency → 2×/week → Scope: This month
4. Verify extra weekly occurrences appear
5. Check pill "Groceries 2×/week this month. Undo"

### Expected Results
- ✅ Frequency changed only for current month
- ✅ Extra occurrences generated
- ✅ Default template remains weekly
- ✅ Fairness recalculated with new frequency

### API Test
```javascript
// Test frequency change override
const frequencyOverride = {
  scope: "month",
  action: "frequency_change",
  frequency: "2x_weekly",
  effective_from: "2024-03-01",
  effective_to: "2024-03-31"
}
```

## Integration Tests

### Precedence Testing
```javascript
// Test override precedence: once > week > month > snooze > always
const overrides = [
  { scope: "always", action: "include" },
  { scope: "week", action: "exclude" },  // This should win
  { scope: "month", action: "include" }
]

// Expected result: task excluded for the week
```

### Idempotent Operations
```javascript
// Test duplicate override prevention
const duplicate1 = { household_id: "1", task_id: "task1", scope: "week", action: "exclude", effective_from: "2024-03-11" }
const duplicate2 = { household_id: "1", task_id: "task1", scope: "week", action: "exclude", effective_from: "2024-03-11" }

// Expected: Second insert should be ignored or update existing
```

### Undo System Testing
```javascript
// Test undo functionality
1. Create override
2. Wait for confirmation pill
3. Click undo within 30 seconds
4. Verify override deleted
5. Verify plan regenerated
6. Verify fairness recalculated
```

### Fairness Threshold Testing
```javascript
// Test fairness hint threshold
const highImpactTask = { default_duration: 60, difficulty: 2 } // 120 points
const lowImpactTask = { default_duration: 15, difficulty: 1 }  // 15 points

// Expected: Hint shows for high impact, not for low impact
```

## Performance Tests

### Bulk Actions
- Test selecting 20+ tasks and applying bulk exclude
- Verify single database transaction
- Verify reasonable response time (<2s)

### Large Date Ranges
- Test year-long overrides with daily tasks
- Verify efficient date range queries
- Test overlap detection performance

## Error Handling Tests

### Invalid Scopes
```javascript
// Test invalid scope handling
const invalidOverride = { scope: "invalid", action: "exclude" }
// Expected: Validation error
```

### Missing Permissions
```javascript
// Test RLS enforcement
const unauthorizedOverride = { household_id: "other_household" }
// Expected: Permission denied
```

### Date Validation
```javascript
// Test date range validation
const invalidRange = { 
  effective_from: "2024-03-15",
  effective_to: "2024-03-10"  // before start date
}
// Expected: Validation error
```

## Accessibility Tests

### Keyboard Navigation
- Tab through scope menu options
- Use Enter/Space to select options
- Navigate confirmation pill with keyboard

### Screen Reader Support
- Verify aria-labels on scope options
- Test confirmation pill announcements
- Validate fairness hint accessibility

## Browser Compatibility

### Tested Browsers
- Chrome 120+
- Firefox 115+
- Safari 16+
- Edge 120+

### Mobile Testing
- iOS Safari
- Android Chrome
- Touch interaction with scope menu
- Responsive confirm pill placement

## Monitoring & Analytics

### Success Metrics
- Override creation success rate > 99%
- Undo usage rate (target 5-10%)
- Plan regeneration time < 2s
- Fairness hint engagement rate

### Error Monitoring
- Override creation failures
- Plan generation timeouts
- Database constraint violations
- RLS policy violations