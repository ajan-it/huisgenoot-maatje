import { supabase } from "@/integrations/supabase/client";

export async function seedTestHousehold() {
  try {
    // Check if we already have a test household
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user for seeding');
      return null;
    }

    // Get or create household
    let { data: existingMember } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    let householdId: string;

    if (existingMember) {
      householdId = existingMember.household_id;
      console.log('✅ Using existing household:', householdId);
    } else {
      // Create new household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          settings: {},
          boost_settings: {
            enabled: true,
            channels: ['push'],
            quiet_hours: { start: '21:30', end: '07:00' }
          }
        })
        .select()
        .single();

      if (householdError) throw householdError;
      householdId = household.id;
      console.log('✅ Created test household:', householdId);
    }

    // Check if we already have people
    const { data: existingPeople } = await supabase
      .from('people')
      .select('*')
      .eq('household_id', householdId);

    if (existingPeople && existingPeople.length >= 2) {
      console.log('✅ Test people already exist');
      return { householdId, people: existingPeople };
    }

    // Create test people: Father and Mother (not "Ouder 1/2")
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .insert([
        {
          household_id: householdId,
          first_name: 'Father',
          role: 'adult',
          weekly_time_budget: 300,
          disliked_tasks: [],
          no_go_tasks: []
        },
        {
          household_id: householdId,
          first_name: 'Mother',
          role: 'adult',
          weekly_time_budget: 300,
          disliked_tasks: [],
          no_go_tasks: []
        }
      ])
      .select();

    if (peopleError) throw peopleError;

    console.log('✅ Created test people:', people?.map(p => p.first_name));

    // Generate September 2025 plan
    const { data: planData, error: planError } = await supabase.functions.invoke('plan-generate-with-overrides', {
      body: {
        household_id: householdId,
        date_range: {
          start: '2025-09-01',
          end: '2025-09-30'
        },
        context: 'monthly_test',
        selected_tasks: [] // Use default tasks
      }
    });

    if (planError) throw planError;

    console.log('✅ Generated September 2025 plan:', planData);

    return { householdId, people, planData };

  } catch (error) {
    console.error('❌ Error seeding test household:', error);
    throw error;
  }
}

// Test assertions
export async function runCalendarTests(householdId: string) {
  try {
    console.log('🧪 Running calendar consistency tests...');

    // Test 1: Week vs Month counts match for the same date range
    const testDate = new Date('2025-09-15'); // Mid-September
    const weekStart = new Date('2025-09-15'); // Monday
    const weekEnd = new Date('2025-09-21'); // Sunday

    const { data: weekOccurrences } = await supabase
      .from('occurrences')
      .select('id, tasks(name), people(first_name)')
      .gte('date', '2025-09-15')
      .lte('date', '2025-09-21')
      .in('status', ['scheduled', 'done', 'moved']);

    const { data: monthOccurrences } = await supabase
      .from('occurrences')
      .select('id, tasks(name), people(first_name)')
      .gte('date', '2025-09-01')
      .lte('date', '2025-09-30')
      .in('status', ['scheduled', 'done', 'moved']);

    console.log('📊 Test Results:');
    console.log(`- Week occurrences (Sep 15-21): ${weekOccurrences?.length || 0}`);
    console.log(`- Month occurrences (Sep 1-30): ${monthOccurrences?.length || 0}`);

    // Test 2: Assignee names come from people.first_name
    const sampleOccurrences = monthOccurrences?.slice(0, 5) || [];
    console.log('👥 Sample assignee names:');
    sampleOccurrences.forEach((occ, i) => {
      console.log(`  ${i + 1}. ${occ.tasks?.name} → ${(occ as any).people?.first_name || 'Unassigned'}`);
    });

    return {
      weekCount: weekOccurrences?.length || 0,
      monthCount: monthOccurrences?.length || 0,
      sampleNames: sampleOccurrences.map(occ => (occ as any).people?.first_name).filter(Boolean)
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}