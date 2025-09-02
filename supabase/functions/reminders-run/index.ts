import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderData {
  occurrence_id: string;
  household_id: string;
  task_name: string;
  due_at: string;
  assignee_name: string;
  reminder_level: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting reminder processing...');
    
    // Get current time in Europe/Amsterdam timezone
    const now = new Date();
    const amsterdamTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(amsterdamTime.split(' ')[1].split(':')[0]);
    const isQuietHours = currentHour >= 21 || currentHour < 7;
    
    console.log(`Current Amsterdam time: ${amsterdamTime}, Quiet hours: ${isQuietHours}`);
    
    // Get households with email reminders enabled
    const { data: households, error: householdsError } = await supabase
      .from('households')
      .select('id, reminder_settings')
      .eq('reminder_settings->email_enabled', true);
    
    if (householdsError) {
      console.error('Error fetching households:', householdsError);
      throw householdsError;
    }
    
    console.log(`Found ${households?.length || 0} households with reminders enabled`);
    
    let totalSent = 0;
    
    for (const household of households || []) {
      const remindersSent = await processHouseholdReminders(household.id, now, isQuietHours);
      totalSent += remindersSent;
    }
    
    console.log(`Reminder processing complete. Total sent: ${totalSent}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent,
        timestamp: amsterdamTime 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in reminders-run function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

async function processHouseholdReminders(householdId: string, now: Date, isQuietHours: boolean): Promise<number> {
  let sentCount = 0;
  
  // Calculate time windows
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twentySixHoursFromNow = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // T-24h reminders (level 1)
  const { data: t24hOccurrences, error: t24hError } = await supabase
    .from('occurrences')
    .select(`
      id, due_at, reminder_level, task_id,
      tasks!inner(name),
      plans!inner(household_id),
      people!occurrences_assigned_person_fkey(first_name)
    `)
    .eq('plans.household_id', householdId)
    .eq('is_critical', true)
    .eq('reminder_level', 0)
    .gte('due_at', twentyFourHoursFromNow.toISOString())
    .lte('due_at', twentySixHoursFromNow.toISOString())
    .neq('status', 'completed');
    
  if (t24hError) {
    console.error('Error fetching T-24h occurrences:', t24hError);
  } else if (t24hOccurrences?.length) {
    for (const occ of t24hOccurrences) {
      if (!isQuietHours) {
        await sendReminderEmail(occ, 1, householdId);
        await updateReminderLevel(occ.id, 1);
        sentCount++;
      }
    }
  }
  
  // T-2h reminders (level 2)
  const { data: t2hOccurrences, error: t2hError } = await supabase
    .from('occurrences')
    .select(`
      id, due_at, reminder_level, task_id,
      tasks!inner(name),
      plans!inner(household_id),
      people!occurrences_assigned_person_fkey(first_name)
    `)
    .eq('plans.household_id', householdId)
    .eq('is_critical', true)
    .lt('reminder_level', 2)
    .gte('due_at', twoHoursFromNow.toISOString())
    .lte('due_at', threeHoursFromNow.toISOString())
    .neq('status', 'completed');
    
  if (t2hError) {
    console.error('Error fetching T-2h occurrences:', t2hError);
  } else if (t2hOccurrences?.length) {
    for (const occ of t2hOccurrences) {
      if (!isQuietHours) {
        await sendReminderEmail(occ, 2, householdId);
        await updateReminderLevel(occ.id, 2);
        sentCount++;
      }
    }
  }
  
  // Overdue reminders (level 3)
  const { data: overdueOccurrences, error: overdueError } = await supabase
    .from('occurrences')
    .select(`
      id, due_at, reminder_level, task_id,
      tasks!inner(name),
      plans!inner(household_id),
      people!occurrences_assigned_person_fkey(first_name)
    `)
    .eq('plans.household_id', householdId)
    .eq('is_critical', true)
    .lt('reminder_level', 3)
    .lt('due_at', twentyFourHoursAgo.toISOString())
    .neq('status', 'completed');
    
  if (overdueError) {
    console.error('Error fetching overdue occurrences:', overdueError);
  } else if (overdueOccurrences?.length) {
    for (const occ of overdueOccurrences) {
      if (!isQuietHours) {
        await sendReminderEmail(occ, 3, householdId);
        await updateReminderLevel(occ.id, 3);
        sentCount++;
      }
    }
  }
  
  return sentCount;
}

async function sendReminderEmail(occurrence: any, level: number, householdId: string) {
  const fromName = Deno.env.get('REMINDER_FROM_NAME') || 'Huisgenoot Maatje';
  const fromAddr = Deno.env.get('REMINDER_FROM_ADDR') || 'no-reply@huisgenoot.app';
  
  const taskName = occurrence.tasks.name;
  const assigneeName = occurrence.people?.first_name || 'Someone';
  const dueDate = new Date(occurrence.due_at).toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let subject = '';
  let body = '';
  
  switch (level) {
    case 1: // T-24h
      subject = `Heads up: '${taskName}' is due tomorrow`;
      body = `
        <h2>Friendly reminder</h2>
        <p>Hi ${assigneeName},</p>
        <p>Just a heads up that <strong>"${taskName}"</strong> is due tomorrow:</p>
        <p><strong>Due:</strong> ${dueDate}</p>
        <p>No rush, just wanted to give you a gentle heads up!</p>
        <p>Best,<br>Your Huisgenoot Maatje</p>
      `;
      break;
      
    case 2: // T-2h
      subject = `Coming up: '${taskName}' in ~2 hours`;
      body = `
        <h2>Quick reminder</h2>
        <p>Hi ${assigneeName},</p>
        <p><strong>"${taskName}"</strong> is coming up in about 2 hours:</p>
        <p><strong>Due:</strong> ${dueDate}</p>
        <p>Just a friendly nudge when you have a moment!</p>
        <p>Best,<br>Your Huisgenoot Maatje</p>
      `;
      break;
      
    case 3: // Overdue
      subject = `Still open: '${taskName}'`;
      body = `
        <h2>Follow-up</h2>
        <p>Hi ${assigneeName},</p>
        <p><strong>"${taskName}"</strong> was due yesterday:</p>
        <p><strong>Was due:</strong> ${dueDate}</p>
        <p>No worries if you're busy! Just checking in when you get a chance.</p>
        <p>Best,<br>Your Huisgenoot Maatje</p>
      `;
      break;
  }
  
  try {
    // In a real implementation, this would use Supabase SMTP
    // For now, we'll log the email content
    console.log(`EMAIL SEND (Level ${level}):`, {
      to: `household-${householdId}`,
      subject,
      from: `${fromName} <${fromAddr}>`,
      body: body.replace(/\s+/g, ' ').trim()
    });
    
    // TODO: Implement actual SMTP sending via Supabase
    // await supabase.mail.send({
    //   to: recipientEmail,
    //   subject,
    //   html: body,
    //   from: `${fromName} <${fromAddr}>`
    // });
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function updateReminderLevel(occurrenceId: string, level: number) {
  const { error } = await supabase
    .from('occurrences')
    .update({ 
      reminder_level: level,
      last_reminded_at: new Date().toISOString()
    })
    .eq('id', occurrenceId);
    
  if (error) {
    console.error('Error updating reminder level:', error);
    throw error;
  }
}

serve(handler);