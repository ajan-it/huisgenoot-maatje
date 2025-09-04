export const isReminderTesterEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_REMINDER_TESTER === 'true';
};