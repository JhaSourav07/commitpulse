export function trackUser(username: string) {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;

  const timezone =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const payload = JSON.stringify({ username, timezone });

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
