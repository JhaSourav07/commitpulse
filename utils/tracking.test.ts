import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackUser } from './tracking';

const originalSendBeacon = navigator.sendBeacon;

describe('trackUser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    Object.defineProperty(navigator, 'sendBeacon', {
      value: originalSendBeacon,
      configurable: true,
    });
  });

  it('uses sendBeacon when available', () => {
    const sendBeaconMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    trackUser('testuser');

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(sendBeaconMock).toHaveBeenCalledWith('/api/track-user', expect.any(Blob));
  });

  it('falls back to fetch when sendBeacon is not available', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: undefined,
      configurable: true,
    });

    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', fetchMock);

    trackUser('testuser');

    expect(fetchMock).toHaveBeenCalledWith('/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser' }),
      keepalive: true,
    });
  });

  it('falls back to fetch when sendBeacon returns false', () => {
    const sendBeaconMock = vi.fn().mockReturnValue(false);

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', fetchMock);

    trackUser('testuser');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not run in SSR context when window is undefined', () => {
    const originalWindow = globalThis.window;
    const sendBeaconMock = vi.fn();
    const fetchMock = vi.fn();

    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    });

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    vi.stubGlobal('fetch', fetchMock);

    trackUser('octocat');

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    });
  });
});
