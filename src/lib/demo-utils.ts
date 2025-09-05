export function isDemoMode(householdId?: string | null): boolean {
  return !householdId || 
         householdId === 'HH_LOCAL' || 
         householdId.startsWith('HH_LOCAL') ||
         householdId === '00000000-0000-4000-8000-000000000000';
}

export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}