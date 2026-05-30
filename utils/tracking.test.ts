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

  it('does not send when username is empty', () => {
    const sendBeaconMock = vi.fn();
    const fetchMock = vi.fn();

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    vi.stubGlobal('fetch', fetchMock);

    trackUser('');

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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

  it('should verify trackUser sends correct JSON payload structure via sendBeacon Blob content', async () => {
    const sendBeaconMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    trackUser('octocat');

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);

    const callArguments = sendBeaconMock.mock.calls[0];
    const blobPayload = callArguments[1] as Blob;

    expect(blobPayload).toBeInstanceOf(Blob);

    const textContent = await blobPayload.text();
    const parsedJSON = JSON.parse(textContent);

    expect(parsedJSON).toEqual({ username: 'octocat' });
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

  it('handles empty username without crashing', () => {
    const sendBeaconMock = vi.fn().mockReturnValue(true);
    const fetchMock = vi.fn();

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    vi.stubGlobal('fetch', fetchMock);

    expect(() => trackUser('')).not.toThrow();
    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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

  it('handles non-serializable input gracefully without throwing', () => {
    // A circular reference cannot be serialized by JSON.stringify and will throw
    // a TypeError. This test verifies that the utility does not propagate the
    // exception to the caller.
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    const originalStringify = JSON.stringify;
    vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
      throw new TypeError('Converting circular structure to JSON');
    });

    expect(() => trackUser('testuser')).not.toThrow();

    JSON.stringify = originalStringify;
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
