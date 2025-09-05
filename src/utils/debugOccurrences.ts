import { supabase } from "@/integrations/supabase/client";

export async function debugOccurrences() {
  try {
    console.log('🔍 DEBUG: Starting occurrence investigation...');
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.id);
    
    // Get user's households
    const { data: memberships, error: membershipError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', session.user.id);
    
    if (membershipError) {
      console.error('❌ Error fetching memberships:', membershipError);
      return;
    }
    
    console.log('🏠 User households:', memberships?.map(m => m.household_id));
    
    if (!memberships || memberships.length === 0) {
      console.log('❌ No households found');
      return;
    }
    
    // Check plans for each household
    for (const membership of memberships) {
      console.log(`\n📋 Checking plans for household: ${membership.household_id}`);
      
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('household_id', membership.household_id)
        .order('week_start', { ascending: false });
      
      if (plansError) {
        console.error('❌ Error fetching plans:', plansError);
        continue;
      }
      
      console.log(`✅ Found ${plans?.length || 0} plans for household ${membership.household_id}`);
      
      if (plans && plans.length > 0) {
        console.log('Recent plans:', plans.slice(0, 3).map(p => ({
          id: p.id,
          week_start: p.week_start,
          status: p.status
        })));
        
        // Check occurrences for September 2025 in the first plan
        const firstPlan = plans[0];
        
        const { data: sepOccurrences, error: sepError } = await supabase
          .from('occurrences')
          .select('id, date, task_id, assigned_person, status')
          .eq('plan_id', firstPlan.id)
          .gte('date', '2025-09-01')
          .lte('date', '2025-09-30')
          .limit(10);
        
        if (sepError) {
          console.error('❌ Error fetching September occurrences:', sepError);
        } else {
          console.log(`✅ September 2025 occurrences in plan ${firstPlan.id}:`, sepOccurrences?.length || 0);
          if (sepOccurrences && sepOccurrences.length > 0) {
            console.log('Sample occurrences:', sepOccurrences.slice(0, 3));
          }
        }
        
        // Check ANY occurrences for this plan
        const { data: allOccurrences, error: allError } = await supabase
          .from('occurrences')
          .select('id, date')
          .eq('plan_id', firstPlan.id)
          .limit(5);
        
        if (allError) {
          console.error('❌ Error fetching all occurrences:', allError);
        } else {
          console.log(`✅ Total occurrences in plan ${firstPlan.id}:`, allOccurrences?.length || 0);
          if (allOccurrences && allOccurrences.length > 0) {
            console.log('Date range:', {
              earliest: allOccurrences[0]?.date,
              sample: allOccurrences.map(o => o.date)
            });
          }
        }
      }
    }
    
    console.log('🔍 DEBUG: Investigation complete');
    
  } catch (error) {
    console.error('❌ Debug investigation failed:', error);
  }
}