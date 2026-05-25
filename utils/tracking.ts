export function trackUser(name: string) {
  const payload = JSON.stringify({ username: name });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track-user', new Blob([payload], { type: 'application/json' }));
  } else {
    fetch('/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(console.error);
  }
}
