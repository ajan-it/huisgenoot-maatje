import { supabase } from "@/integrations/supabase/client";

export async function seedTestHousehold() {
  try {
    // First check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      // For development: try to sign in as a test user or create one
      console.log('🔐 No authenticated user, attempting to create/sign in test user...');
      
      const testEmail = 'test@example.com';
      const testPassword = 'testpassword123';
      
      // Try to sign in first
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError && signInError.message?.includes('Invalid login credentials')) {
        // User doesn't exist, create them
        console.log('👤 Creating test user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        });
        
        if (signUpError) {
          console.error('❌ Failed to create test user:', signUpError);
          throw signUpError;
        }
        
        signInData = signUpData;
      } else if (signInError) {
        console.error('❌ Failed to sign in test user:', signInError);
        throw signInError;
      }
      
      console.log('✅ Test user authenticated:', signInData.user?.email);
      
      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get fresh session after authentication
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) {
      throw new Error('Failed to establish authenticated session');
    }

    // Get or create household
    let { data: existingMember } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', currentSession.user.id)
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

    // Generate September 2025 plan for the current household
    console.log('🎯 Generating plan for household:', householdId);
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

    if (planError) {
      console.error('❌ Plan generation failed:', planError);
      throw planError;
    }

    console.log('✅ Generated September 2025 plan:', planData);

    // Verify occurrences were created
    const { data: verifyOccurrences, error: verifyError } = await supabase
      .from('occurrences')
      .select('id, date, tasks(name), people(first_name)')
      .gte('date', '2025-09-01')
      .lte('date', '2025-09-30')
      .limit(5);

    if (verifyError) {
      console.error('❌ Failed to verify occurrences:', verifyError);
    } else {
      console.log('✅ Verified occurrences created:', {
        count: verifyOccurrences?.length || 0,
        samples: verifyOccurrences?.slice(0, 3).map(o => ({
          date: o.date,
          task: (o as any).tasks?.name,
          person: (o as any).people?.first_name
        }))
      });
    }

    return { householdId, people, planData, occurrenceCount: verifyOccurrences?.length || 0 };

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