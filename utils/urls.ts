/**
 * Generates the dashboard URL for a given username.
 * Supports SSR by falling back if window is undefined.
 */
export const getDashboardUrl = (username: string): string => {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : ''; // Falls back to an empty string or your production domain during SSR

  return `${origin}/dashboard/${username}`;
};
