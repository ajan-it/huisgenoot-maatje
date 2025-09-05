import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateOverrideRequest {
  occurrence_id: string;
  action: 'exclude' | 'include' | 'frequency_change';
  scope: 'once' | 'week' | 'month' | 'always' | 'snooze';
  snooze_until?: string | null;
  frequency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const requestData: CreateOverrideRequest = await req.json()
    const { occurrence_id, action, scope, snooze_until, frequency } = requestData

    console.log('Creating override:', { occurrence_id, action, scope, user_id: user.id, plan_id: null, household_id: null })

    // Get occurrence details and validate
    const { data: occurrence, error: occError } = await supabase
      .from('occurrences')
      .select(`
        id,
        task_id,
        date,
        plan_id,
        plans!inner(
          id,
          household_id
        )
      `)
      .eq('id', occurrence_id)
      .single()

    if (occError || !occurrence) {
      console.error('Occurrence not found:', occError)
      return new Response(
        JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Task occurrence not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const household_id = occurrence.plans.household_id

    // Check if this is a demo/local plan
    if (!household_id || household_id.startsWith('HH_LOCAL') || household_id === '00000000-0000-4000-8000-000000000000') {
      console.log('Demo/local plan detected:', { household_id, plan_id: occurrence.plan_id, occurrence_id, user_id: user.id })
      return new Response(
        JSON.stringify({ ok: false, code: 'DEMO_MODE', message: 'Sign in and open a real plan to change tasks.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify household membership
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('household_id', household_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      console.error('Household membership check failed:', memberError)
      return new Response(
        JSON.stringify({ ok: false, code: 'FORBIDDEN', message: 'You are not a member of this household' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate effective dates
    const occurrenceDate = new Date(occurrence.date)
    let effective_from: string
    let effective_to: string | null = null

    switch (scope) {
      case 'once':
        effective_from = occurrence.date
        effective_to = occurrence.date
        break
      case 'week':
        const weekStart = new Date(occurrenceDate)
        weekStart.setDate(occurrenceDate.getDate() - occurrenceDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        effective_from = weekStart.toISOString().split('T')[0]
        effective_to = weekEnd.toISOString().split('T')[0]
        break
      case 'month':
        const monthStart = new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth(), 1)
        const monthEnd = new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth() + 1, 0)
        effective_from = monthStart.toISOString().split('T')[0]
        effective_to = monthEnd.toISOString().split('T')[0]
        break
      case 'snooze':
        if (!snooze_until) {
          return new Response(
            JSON.stringify({ ok: false, code: 'INVALID_REQUEST', message: 'Snooze date required for snooze scope' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        effective_from = occurrence.date
        effective_to = snooze_until
        break
      case 'always':
        effective_from = occurrence.date
        // No end date for always
        break
    }

    // Create the override
    const overrideData = {
      household_id,
      task_id: occurrence.task_id,
      scope,
      effective_from,
      effective_to,
      action,
      frequency,
      created_by: user.id
    }

    console.log('Inserting override:', overrideData)

    const { data: override, error: insertError } = await supabase
      .from('task_overrides')
      .insert(overrideData)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create override:', insertError)
      return new Response(
        JSON.stringify({ ok: false, code: 'DATABASE_ERROR', message: 'Failed to create task override' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Override created successfully:', { override_id: override.id, household_id, plan_id: occurrence.plan_id, task_id: occurrence.task_id, action, scope })

    return new Response(
      JSON.stringify({ 
        ok: true, 
        override_id: override.id,
        diff_summary: { 
          added: 0, 
          removed: 1, 
          shifted_points_by_person: {} 
        }
      }),
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