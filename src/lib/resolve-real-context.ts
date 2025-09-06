import { Session } from '@supabase/supabase-js';

export interface RealContext {
  userId: string | null;
  householdId: string | null;
  planId: string | null;
  isDemo: boolean;
}

export interface RouteParams {
  planId?: string | null;
  weekStart?: string | null;
}

export interface LocalStorage {
  lastPlanResponse?: unknown;
}

export function resolveRealContext({
  session,
  route,
  local,
}: {
  session: Session | null;
  route: RouteParams;
  local: LocalStorage;
}): RealContext {
  const userId = session?.user?.id ?? null;
  const routePlanId = route.planId ?? null;

  // Demo mode conditions: no user OR route starts with HH_LOCAL
  const isDemo = !userId || (routePlanId?.startsWith('HH_LOCAL-') ?? false);

  if (import.meta.env.DEV) {
    console.log('🔍 resolveRealContext:', {
      userId: userId?.slice(0, 8) + '...',
      routePlanId,
      isDemo,
      hasSession: !!session,
      hasLocalData: !!local.lastPlanResponse
    });
  }

  if (isDemo) {
    return {
      userId: null,
      householdId: null,
      planId: null,
      isDemo: true
    };
  }

  // For real mode, we need to derive household from route or memberships
  // The planId format should be: <householdId>-<week_start>
  let householdId: string | null = null;
  if (routePlanId && !routePlanId.startsWith('HH_LOCAL-')) {
    const parts = routePlanId.split('-');
    if (parts.length >= 2) {
      // First part should be household UUID
      householdId = parts[0];
    }
  }

  return {
    userId,
    householdId,
    planId: routePlanId,
    isDemo: false
  };
}

export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}