# Email Reminders for Critical Tasks

This document outlines the automated email reminder system for critical household tasks.

## Overview

The reminder system sends gentle, escalating email notifications for tasks marked as critical with due dates. The system respects quiet hours and household preferences.

## Reminder Schedule

### Time Windows (Europe/Amsterdam timezone)

1. **T-24h Reminder (Level 1)**
   - Sent when `due_at` is between 24-26 hours from now
   - Only for tasks with `reminder_level = 0`
   - Subject: "Heads up: '[Task]' is due tomorrow"

2. **T-2h Reminder (Level 2)**  
   - Sent when `due_at` is between 2-3 hours from now
   - Only for tasks with `reminder_level < 2`
   - Subject: "Coming up: '[Task]' in ~2 hours"

3. **Overdue Reminder (Level 3)**
   - Sent when `due_at` is more than 24 hours past
   - Only for tasks with `reminder_level < 3`
   - Subject: "Still open: '[Task]'"

4. **Morning Helper (Optional)**
   - Sent at 07:00 local time for same-day critical tasks
   - Controlled by `reminder_settings.morning_helper_enabled`
   - Behind feature flag, does not interfere with main reminder levels

## Quiet Hours

- **Default**: 21:30 - 07:00 (Europe/Amsterdam)
- **Behavior**: No emails sent during quiet hours
- **Configuration**: Stored in `households.reminder_settings.quiet_hours`

## Household Settings

Reminders are controlled at the household level via `households.reminder_settings`:

```json
{
  "email_enabled": true,
  "morning_helper_enabled": true,
  "quiet_hours": {
    "start": "21:30",
    "end": "07:00"
  }
}
```

### Settings UI Location
- Navigate to Boost Settings page
- Email Reminders section at bottom
- Toggle "Email reminders for critical tasks" to enable/disable

## Idempotence Model

The system prevents duplicate emails through:

1. **Reminder Level Guards**: Each email type only sends once per occurrence
2. **Time Window Queries**: Precise time boundaries prevent overlap
3. **Database Updates**: `reminder_level` and `last_reminded_at` track state

Running the function multiple times within the same 15-minute window will not resend emails.

## Technical Implementation

### Database Schema

**Occurrences Table**:
- `due_at TIMESTAMPTZ` - When the task is due
- `reminder_policy TEXT` - Always 'gentle' for now
- `reminder_level INT` - Tracks which reminders have been sent (0-3)
- `last_reminded_at TIMESTAMPTZ` - Timestamp of last reminder
- `is_critical BOOLEAN` - Must be true for reminders to trigger

### Edge Function

**Function**: `supabase/functions/reminders-run/index.ts`
**Schedule**: Every 15 minutes via Supabase cron
**Authentication**: Requires JWT (`verify_jwt = true`)

### Email Configuration

Set these secrets in Supabase Dashboard → Functions → Secrets:

- `REMINDER_FROM_NAME` (default: "Huisgenoot Maatje")
- `REMINDER_FROM_ADDR` (default: "no-reply@huisgenoot.app")

## Testing

### Development Testing

1. **Manual Trigger**: Visit `/dev/run-reminders` (development only)
2. **Mock Data**: Create test occurrences with various `due_at` times
3. **Settings**: Toggle household reminder settings to test disable/enable

### Unit Tests

- Time window classification logic
- Quiet hours deferral
- Idempotence verification (no double-sending)

### Integration Tests  

- End-to-end email sending with mocked SMTP
- Reminder level progression (0 → 1 → 2 → 3)
- Settings toggle functionality

## Email Content

All emails use a gentle, respectful tone:

- **Personal**: Address by first name
- **Context**: Include task name and due date/time  
- **Non-nagging**: Friendly language, no pressure
- **Helpful**: Clear information about what and when

### Example T-24h Email

```
Subject: Heads up: 'Take out recycling' is due tomorrow

Hi Sarah,

Just a heads up that "Take out recycling" is due tomorrow:

Due: Wednesday, March 15, 2024 at 07:30

No rush, just wanted to give you a gentle heads up!

Best,
Your Huisgenoot Maatje
```

## Future Enhancements

- **Per-person settings**: Move from household to individual preferences
- **Multiple channels**: SMS, WhatsApp, push notifications
- **Custom scheduling**: User-defined reminder windows
- **Smart learning**: Adapt timing based on completion patterns

## Troubleshooting

### No Emails Being Sent

1. Check `households.reminder_settings.email_enabled = true`
2. Verify cron job is running every 15 minutes
3. Check function logs for errors
4. Ensure `due_at` and `is_critical` are set on occurrences

### Emails Sent During Quiet Hours

1. Verify household timezone is Europe/Amsterdam
2. Check quiet hours configuration in settings
3. Review function logs for time calculations

### Duplicate Emails

1. Verify `reminder_level` is incrementing properly
2. Check for multiple cron jobs running
3. Review time window query logic

## Support

For issues or questions about the reminder system, check:

1. Function logs in Supabase Dashboard
2. Database state (`reminder_level`, `last_reminded_at`)
3. Household settings configuration