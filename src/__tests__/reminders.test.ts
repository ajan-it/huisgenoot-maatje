import { describe, it, expect, beforeEach } from 'vitest';

// Helper functions that would be extracted from the edge function
function classifyOccurrencesByReminder(occurrences: any[], now: Date) {
  const results = {
    t24h: [] as any[],
    t2h: [] as any[],
    overdue: [] as any[]
  };

  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twentySixHoursFromNow = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const occ of occurrences) {
    const dueAt = new Date(occ.due_at);

    // T-24h window (level 1)
    if (occ.reminder_level === 0 && 
        dueAt >= twentyFourHoursFromNow && 
        dueAt <= twentySixHoursFromNow) {
      results.t24h.push(occ);
    }

    // T-2h window (level 2)  
    if (occ.reminder_level < 2 && 
        dueAt >= twoHoursFromNow && 
        dueAt <= threeHoursFromNow) {
      results.t2h.push(occ);
    }

    // Overdue window (level 3)
    if (occ.reminder_level < 3 && dueAt < twentyFourHoursAgo) {
      results.overdue.push(occ);
    }
  }

  return results;
}

function isQuietHours(now: Date, quietHours = { start: '21:30', end: '07:00' }) {
  const amsterdamTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
  
  const [hours, minutes] = amsterdamTime.split(':').map(Number);
  const currentMinutes = hours * 60 + minutes;
  
  const [startHours, startMinutes] = quietHours.start.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  
  const [endHours, endMinutes] = quietHours.end.split(':').map(Number);
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Handle overnight quiet hours (21:30 - 07:00)
  if (startTotalMinutes > endTotalMinutes) {
    return currentMinutes >= startTotalMinutes || currentMinutes < endTotalMinutes;
  }
  
  return currentMinutes >= startTotalMinutes && currentMinutes < endTotalMinutes;
}

describe('Reminder Time Window Logic', () => {
  let mockNow: Date;
  let testOccurrences: any[];

  beforeEach(() => {
    mockNow = new Date('2024-03-15T12:00:00Z'); // Friday noon UTC
    
    testOccurrences = [
      {
        id: '1',
        due_at: new Date(mockNow.getTime() + 25 * 60 * 60 * 1000).toISOString(), // T+25h
        reminder_level: 0,
        is_critical: true,
        status: 'scheduled'
      },
      {
        id: '2', 
        due_at: new Date(mockNow.getTime() + 2.5 * 60 * 60 * 1000).toISOString(), // T+2.5h
        reminder_level: 1,
        is_critical: true,
        status: 'scheduled'
      },
      {
        id: '3',
        due_at: new Date(mockNow.getTime() - 36 * 60 * 60 * 1000).toISOString(), // T-36h (overdue)
        reminder_level: 2,
        is_critical: true,
        status: 'scheduled'
      },
      {
        id: '4',
        due_at: new Date(mockNow.getTime() + 25 * 60 * 60 * 1000).toISOString(), // T+25h
        reminder_level: 1, // Already reminded at level 1
        is_critical: true,
        status: 'scheduled'
      }
    ];
  });

  it('should classify occurrences into correct time windows', () => {
    const results = classifyOccurrencesByReminder(testOccurrences, mockNow);

    expect(results.t24h).toHaveLength(1);
    expect(results.t24h[0].id).toBe('1'); // Only level 0 occurrence in T-24h window

    expect(results.t2h).toHaveLength(1);
    expect(results.t2h[0].id).toBe('2'); // Level 1 occurrence in T-2h window

    expect(results.overdue).toHaveLength(1);
    expect(results.overdue[0].id).toBe('3'); // Level 2 occurrence that's overdue
  });

  it('should respect reminder level guards', () => {
    const alreadyRemindedOccurrence = {
      id: '5',
      due_at: new Date(mockNow.getTime() + 25 * 60 * 60 * 1000).toISOString(),
      reminder_level: 3, // Already at max level
      is_critical: true,
      status: 'scheduled'
    };

    const results = classifyOccurrencesByReminder([alreadyRemindedOccurrence], mockNow);

    expect(results.t24h).toHaveLength(0);
    expect(results.t2h).toHaveLength(0);
    expect(results.overdue).toHaveLength(0);
  });
});

describe('Quiet Hours Detection', () => {
  it('should detect quiet hours correctly for Europe/Amsterdam timezone', () => {
    // 22:00 Amsterdam time (within quiet hours 21:30-07:00)
    const quietTime = new Date('2024-03-15T21:00:00Z'); // 22:00 CET
    expect(isQuietHours(quietTime)).toBe(true);

    // 06:00 Amsterdam time (within quiet hours)
    const earlyMorning = new Date('2024-03-15T05:00:00Z'); // 06:00 CET  
    expect(isQuietHours(earlyMorning)).toBe(true);

    // 10:00 Amsterdam time (outside quiet hours)
    const daytime = new Date('2024-03-15T09:00:00Z'); // 10:00 CET
    expect(isQuietHours(daytime)).toBe(false);

    // 19:00 Amsterdam time (outside quiet hours)
    const evening = new Date('2024-03-15T18:00:00Z'); // 19:00 CET
    expect(isQuietHours(evening)).toBe(false);
  });
});

describe('Idempotence Verification', () => {
  it('should not double-send within same time window', () => {
    const occurrence = {
      id: '1',
      due_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // T+25h
      reminder_level: 0,
      is_critical: true,
      status: 'scheduled'
    };

    // First run - should classify for T-24h
    const firstRun = classifyOccurrencesByReminder([occurrence], new Date());
    expect(firstRun.t24h).toHaveLength(1);

    // Simulate reminder sent (level bumped to 1)
    const afterFirstReminder = { ...occurrence, reminder_level: 1 };

    // Second run within same window - should not classify for T-24h again
    const secondRun = classifyOccurrencesByReminder([afterFirstReminder], new Date());
    expect(secondRun.t24h).toHaveLength(0);
  });
});