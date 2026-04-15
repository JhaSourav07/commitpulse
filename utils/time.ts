// utils/time.ts

export function getSecondsUntilUTCMidnight(): number {
  const now = new Date();
  
  // Create a Date object for the upcoming midnight in UTC
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  
  // Return the difference in seconds
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}