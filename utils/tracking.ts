export function trackUser(username: string) {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
  if (!username) return;

  const payload = JSON.stringify({ username });

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
