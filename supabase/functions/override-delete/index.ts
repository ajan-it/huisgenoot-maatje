import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface DeleteOverrideRequest {
  override_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ ok: false, code: 'UNAUTHORIZED', message: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestData: DeleteOverrideRequest = await req.json()
    const { override_id } = requestData

    console.log('Deleting override:', { override_id, user_id: user.id })

    // Get override details and validate ownership/membership
    const { data: override, error: fetchError } = await supabase
      .from('task_overrides')
      .select('id, household_id, created_by')
      .eq('id', override_id)
      .single()

    if (fetchError || !override) {
      console.error('Override not found:', fetchError)
      return new Response(
        JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Task override not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is household member
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('household_id', override.household_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      console.error('Household membership check failed:', memberError)
      return new Response(
        JSON.stringify({ ok: false, code: 'FORBIDDEN', message: 'You are not a member of this household' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete the override
    const { error: deleteError } = await supabase
      .from('task_overrides')
      .delete()
      .eq('id', override_id)

    if (deleteError) {
      console.error('Failed to delete override:', deleteError)
      return new Response(
        JSON.stringify({ ok: false, code: 'DATABASE_ERROR', message: 'Failed to delete task override' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Override deleted successfully:', override_id)

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, code: 'INTERNAL_ERROR', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})