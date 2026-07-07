/**
 * Fires a fire-and-forget analytics ping to `/api/track-user` for the given GitHub username.
 *
 * Uses `navigator.sendBeacon` when available (reliable on page unload), falling back to
 * `fetch` with `keepalive: true` for environments that do not support the Beacon API.
 *
 * The function is a no-op when:
 * - Running outside of a browser context (`navigator` or `window` is undefined).
 * - `username` is an empty string or falsy.
 *
 * @param {string} username - The GitHub username to record the visit for.
 * @returns {void}
 */
/**
 * Resolves the track-user endpoint URL against NEXT_PUBLIC_SITE_URL when set.
 * sendBeacon always resolves relative to window.location.origin and cannot be
 * redirected — when the API lives on a different host, relative paths silently
 * hit the wrong origin. Using an absolute URL derived from NEXT_PUBLIC_SITE_URL
 * ensures pings reach the correct endpoint regardless of deployment topology.
 */
function getTrackUserUrl(): string {
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.trim()) || '';
  const normalizedBase = base.replace(/\/+$/, '');
  return normalizedBase ? `${normalizedBase}/api/track-user` : '/api/track-user';
}

export function trackUser(username: string) {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
  if (!username) return;
  let payload: string;

  try {
    payload = JSON.stringify({ username });
  } catch (error) {
    console.error('Failed to format tracking payload', error);
    return;
  }

  const url = getTrackUserUrl();
  const beaconQueued = navigator.sendBeacon
    ? navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
    : false;

  if (!beaconQueued) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(console.error);
  }
}
