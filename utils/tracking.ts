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

  const beaconQueued = navigator.sendBeacon
    ? navigator.sendBeacon('/api/track-user', new Blob([payload], { type: 'application/json' }))
    : false;

  if (!beaconQueued) {
    fetch('/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(console.error);
  }
}
