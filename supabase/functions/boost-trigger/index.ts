import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BoostTriggerRequest {
  occurrenceId?: string;
  checkAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { occurrenceId, checkAll = false }: BoostTriggerRequest = await req.json();

    console.log('Boost trigger called:', { occurrenceId, checkAll });

    if (!checkAll && !occurrenceId) {
      return new Response(
        JSON.stringify({ error: 'Either occurrenceId or checkAll must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let occurrencesToCheck: string[] = [];

    if (checkAll) {
      // Get all occurrences that might need boosts (within next hour)
      const { data: occurrences, error } = await supabase
        .from('occurrences')
        .select('id')
        .eq('status', 'scheduled')
        .eq('boost_enabled', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching occurrences:', error);
        throw error;
      }

      occurrencesToCheck = occurrences?.map(o => o.id) || [];
    } else {
      occurrencesToCheck = [occurrenceId!];
    }

    const results = [];

    for (const id of occurrencesToCheck) {
      try {
        // Check if boost is needed using the database function
        const { data: needsBoost, error: checkError } = await supabase
          .rpc('check_boost_needed', { occurrence_id: id });

        if (checkError) {
          console.error(`Error checking boost for ${id}:`, checkError);
          continue;
        }

        if (needsBoost) {
          // Get occurrence details for boost
          const { data: occurrence, error: fetchError } = await supabase
            .from('occurrences')
            .select(`
              *,
              plans!inner(household_id, households!inner(boost_settings)),
              tasks!inner(name),
              people!inner(first_name, contact)
            `)
            .eq('id', id)
            .single();

          if (fetchError) {
            console.error(`Error fetching occurrence details for ${id}:`, fetchError);
            continue;
          }

          // Send boost notifications
          const boostResult = await sendBoostNotifications(occurrence);
          results.push({ occurrenceId: id, sent: boostResult.success, channels: boostResult.channels });
        } else {
          results.push({ occurrenceId: id, sent: false, reason: 'boost not needed' });
        }
      } catch (error) {
        console.error(`Error processing occurrence ${id}:`, error);
        results.push({ occurrenceId: id, sent: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ results, processed: occurrencesToCheck.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in boost-trigger function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function sendBoostNotifications(occurrence: any) {
  const channels = occurrence.plans.households.boost_settings?.channels || ['push'];
  const results = { success: false, channels: [] };

  for (const channel of channels) {
    try {
      // Log the boost attempt
      const { error: logError } = await supabase
        .rpc('log_boost_interaction', {
          occurrence_id: occurrence.id,
          person_id: occurrence.assigned_person,
          channel_used: channel,
          interaction_type: null,
          outcome_text: `Boost sent via ${channel}`
        });

      if (logError) {
        console.error('Error logging boost:', logError);
      }

      // For now, just log the boost (actual sending would require external services)
      console.log(`Boost sent via ${channel} for task "${occurrence.tasks.name}" to person ${occurrence.people?.first_name}`);
      
      results.channels.push(channel);
      results.success = true;

    } catch (error) {
      console.error(`Error sending boost via ${channel}:`, error);
    }
  }

  return results;
}

serve(handler);