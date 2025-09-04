# Reminder Tester

A safe, admin-only tool for testing the reminder engine functionality.

## Setup

### Enable Feature Flag

Add to `.env`:
```
VITE_ENABLE_REMINDER_TESTER=true
```

### Access Requirements

- Feature flag must be enabled
- User must have 'owner' role in at least one household
- Accessible at `/dev/reminders`

## Features

### 1. Household Selection
- Choose from households where you're a member
- View reminder settings (email enabled, quiet hours, etc.)

### 2. Occurrence Search
- Filter by date range (default: last 30 days → next 30 days)
- Filter by assigned person
- Filter by status (uses dynamic enum from database)
- Filter to critical tasks only
- Table view with all relevant details

### 3. Test Configuration
- **Timing Presets:**
  - T-24h: Sets due_at to 25 hours from now
  - T-2h: Sets due_at to 110 minutes from now  
  - Overdue: Sets due_at to 25 hours ago
  - Custom: Pick any date/time
- **Options:**
  - Mark as Critical
  - Reset Reminder Level (sets to 0, clears last_reminded_at)
- **Apply/Revert:** Safe backup and restore functionality

### 4. Run & Observe
- Execute the reminder function directly
- View result summary (sent count, households processed)
- Basic log display
- Error handling and feedback

### 5. Badge Preview
- See current status badges
- Timing analysis (which reminder window applies)
- Quick links to main app views

## Usage

1. **Select Household:** Choose household to test
2. **Find Occurrence:** Use filters to locate the task occurrence
3. **Configure Test:** Set timing and options, then Apply
4. **Run Reminders:** Execute the function and observe results
5. **Check Badges:** Verify status badges are correct
6. **Revert:** Restore original values when done

## Safety Features

- Only modifies selected occurrence
- Stores backup of original values
- One-click revert functionality
- Feature-flagged and role-gated
- Clear warnings and confirmations

## QA Script

1. Open `/dev/reminders` (ensure feature flag is on)
2. Choose household → filter by "assigned to me" → pick occurrence
3. Set "Overdue + Mark critical + Reset reminder level" → Apply
4. Click "Run reminders now" → watch logs
5. Expect "1 reminder sent" or see why 0 sent
6. Check badge preview for Overdue badge
7. Open regular plan/task view → confirm badge appears
8. Press Revert → values restored

## Technical Notes

- Uses existing Supabase client (respects RLS)
- Dynamic status filtering via `get_occurrence_status_labels` function
- Calls `reminders-run` edge function with `origin: 'ui/dev'`
- All changes through standard APIs, no raw SQL
- Built with shadcn/ui components and existing patterns