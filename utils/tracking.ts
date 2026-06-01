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
