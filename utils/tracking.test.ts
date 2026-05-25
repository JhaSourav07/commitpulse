import { describe, it, expect, vi, afterEach } from 'vitest';
import { trackUser } from './tracking';

describe('trackUser', () => {
  const originalSendBeacon = navigator.sendBeacon;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    navigator.sendBeacon = originalSendBeacon;
    globalThis.fetch = originalFetch;
  });

  it('calls navigator.sendBeacon when available', () => {
    const sendBeacon = vi.fn();
    navigator.sendBeacon = sendBeacon;

    trackUser('testuser');

    expect(sendBeacon).toHaveBeenCalledWith('/api/track-user', expect.any(Blob));
  });

  it('falls back to fetch when sendBeacon is not available', () => {
    navigator.sendBeacon = undefined as unknown as typeof navigator.sendBeacon;
    const fetch = vi.fn(() => Promise.resolve(new Response()));
    globalThis.fetch = fetch;

    trackUser('testuser');

    expect(fetch).toHaveBeenCalledWith('/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser' }),
    });
  });
});
