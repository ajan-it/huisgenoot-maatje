import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BoostResponseRequest {
  occurrenceId: string;
  interactionType: 'acknowledged' | 'completed' | 'rescheduled' | 'swapped' | 'backup_requested' | 'missed';
  personId?: string;
  newDate?: string;
  newTime?: string;
  newAssignedPerson?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      occurrenceId,
      interactionType,
      personId,
      newDate,
      newTime,
      newAssignedPerson,
      notes
    }: BoostResponseRequest = await req.json();

    console.log('Boost response received:', { occurrenceId, interactionType, personId });

    // Validate required fields
    if (!occurrenceId || !interactionType) {
      return new Response(
        JSON.stringify({ error: 'occurrenceId and interactionType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the interaction
    const { error: logError } = await supabase
      .rpc('log_boost_interaction', {
        occurrence_id: occurrenceId,
        person_id: personId || null,
        channel_used: 'push', // Default channel for responses
        interaction_type: interactionType,
        outcome_text: notes || `User ${interactionType} the task`
      });

    if (logError) {
      console.error('Error logging boost interaction:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log interaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle the specific interaction type
    let updateResult = { success: true };

    switch (interactionType) {
      case 'acknowledged':
        // Just logged, no status change needed
        break;

      case 'completed':
        const { error: completeError } = await supabase
          .from('occurrences')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', occurrenceId);
        
        if (completeError) {
          console.error('Error marking task complete:', completeError);
          updateResult = { success: false };
        }
        break;

      case 'rescheduled':
        const updates: any = { updated_at: new Date().toISOString() };
        if (newDate) updates.date = newDate;
        if (newTime) updates.start_time = newTime;

        const { error: rescheduleError } = await supabase
          .from('occurrences')
          .update(updates)
          .eq('id', occurrenceId);
        
        if (rescheduleError) {
          console.error('Error rescheduling task:', rescheduleError);
          updateResult = { success: false };
        }
        break;

      case 'swapped':
        if (!newAssignedPerson) {
          return new Response(
            JSON.stringify({ error: 'newAssignedPerson is required for swapped interaction' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: swapError } = await supabase
          .from('occurrences')
          .update({ 
            assigned_person: newAssignedPerson,
            updated_at: new Date().toISOString()
          })
          .eq('id', occurrenceId);
        
        if (swapError) {
          console.error('Error swapping task assignment:', swapError);
          updateResult = { success: false };
        }
        break;

      case 'backup_requested':
        const { error: backupError } = await supabase
          .from('occurrences')
          .update({ 
            has_backup: true,
            backup_person_id: newAssignedPerson || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', occurrenceId);
        
        if (backupError) {
          console.error('Error requesting backup:', backupError);
          updateResult = { success: false };
        }
        break;

      case 'missed':
        const { error: missedError } = await supabase
          .from('occurrences')
          .update({ 
            status: 'missed',
            updated_at: new Date().toISOString()
          })
          .eq('id', occurrenceId);
        
        if (missedError) {
          console.error('Error marking task missed:', missedError);
          updateResult = { success: false };
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid interaction type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: updateResult.success,
        message: `Boost ${interactionType} processed successfully`,
        occurrenceId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in boost-response function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);