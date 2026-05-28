export const getDashboardUrl = (
  username: string,
  origin?: string
): string => {

  if (origin) {
    return `${origin}/dashboard/${username}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/dashboard/${username}`;
  }

  return `https://commitpulse.vercel.app/dashboard/${username}`; // ✅ better fallback
};