export function isDemoMode(householdId?: string | null): boolean {
  return !householdId || householdId === 'HH_LOCAL' || householdId.startsWith('HH_LOCAL');
}

export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}