const FALLBACK_ORIGIN = 'https://commitpulse.vercel.app';

/**
 * Resolves the base origin URL for the current environment.
 *
 * Priority order:
 * 1. `window.location.origin` — used when running in the browser.
 * 2. `NEXT_PUBLIC_SITE_URL` environment variable — used in server-side contexts.
 * 3. Hardcoded fallback (`https://commitpulse.vercel.app`).
 *
 * @returns {string} The resolved base origin URL (e.g. `https://commitpulse.app` or `http://localhost:3000`).
 */
export function getOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
  return (
    (typeof window !== 'undefined' ? window.location.origin : null) ?? envOrigin ?? FALLBACK_ORIGIN
  );
}

/**
 * Constructs the full absolute URL for a user's dashboard page.
 *
 * @param {string} username - The GitHub username whose dashboard URL should be generated.
 * @returns {string} The absolute dashboard URL (e.g. `https://commitpulse.app/dashboard/octocat`).
 */
export function getDashboardUrl(username: string): string {
  return `${getOrigin()}/dashboard/${encodeURIComponent(username)}`;
}
