import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackUser } from './tracking';

describe('trackUser Edge Cases & Empty Fallback Tests', () => {
  let originalWindow: typeof globalThis.window;
  let originalNavigator: typeof globalThis.navigator;
  let originalFetch: typeof globalThis.fetch;
  let originalBlob: typeof globalThis.Blob;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalNavigator = globalThis.navigator;
    originalFetch = globalThis.fetch;
    originalBlob = globalThis.Blob;

    globalThis.window = {} as unknown as typeof globalThis.window;
    globalThis.navigator = {
      sendBeacon: vi.fn().mockReturnValue(true),
    } as unknown as typeof globalThis.navigator;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    // Ensure Blob is polyfilled securely to prevent hydration or runtime errors in CI
    if (typeof globalThis.Blob === 'undefined') {
      globalThis.Blob = class Blob {
        constructor(
          public parts: string[],
          public options: Record<string, string>
        ) {}
      } as unknown as typeof globalThis.Blob;
    }

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.navigator = originalNavigator;
    globalThis.fetch = originalFetch;
    globalThis.Blob = originalBlob;
    vi.restoreAllMocks();
  });

  it('1. correctly short-circuits and ignores empty string usernames without throwing', () => {
    trackUser('');
    expect(globalThis.navigator.sendBeacon).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('2. safely acts as a non-breaking no-op when executing in a headless/server environment (missing window/navigator)', () => {
    // Simulate empty server environment without triggering TypeScript readonly errors
    const globals = globalThis as unknown as Record<string, unknown>;
    delete globals.window;
    delete globals.navigator;

    expect(() => trackUser('octocat')).not.toThrow();
  });

  it('3. seamlessly falls back to the fetch API when navigator.sendBeacon is unavailable or undefined', () => {
    const nav = globalThis.navigator as unknown as Record<string, unknown>;
    delete nav.sendBeacon;

    trackUser('octocat');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/track-user',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      })
    );
  });

  it('4. gracefully tolerates beacon queuing failures by automatically deploying the fetch fallback', () => {
    // sendBeacon returns false when the queue is full or payload is too large
    globalThis.navigator = {
      sendBeacon: vi.fn().mockReturnValue(false),
    } as unknown as typeof globalThis.navigator;

    trackUser('octocat');
    expect(globalThis.navigator.sendBeacon).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalled(); // Triggered fallback
  });

  it('5. guarantees no unhandled promise rejections if the fallback fetch network request completely fails', async () => {
    globalThis.navigator = {
      sendBeacon: vi.fn().mockReturnValue(false),
    } as unknown as typeof globalThis.navigator;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    // Should not throw or cause unhandled rejections
    expect(() => trackUser('octocat')).not.toThrow();

    // Wait a tick to ensure async catch block executes cleanly
    await new Promise(process.nextTick);
    expect(console.error).toHaveBeenCalled();
  });
});
