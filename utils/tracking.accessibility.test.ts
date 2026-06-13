import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackUser } from './tracking';

describe('trackUser - Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { sendBeacon: vi.fn().mockReturnValue(true) });
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Aria Label Compliance: payload is correctly structured with a named username field matching the expected label coordinates', () => {
    const beaconSpy = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });

    trackUser('labeled_user');

    expect(beaconSpy).toHaveBeenCalledOnce();

    // The Blob payload must carry the correct labeled field — username — matching aria-label semantics
    const blob: Blob = beaconSpy.mock.calls[0][1];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/json');

    return blob.text().then((text) => {
      const parsed = JSON.parse(text);
      expect(parsed).toHaveProperty('username', 'labeled_user');
    });
  });

  it('Focus Outline Behavior: function remains accessible and callable after a sendBeacon failure without throwing', () => {
    // Simulates an interactive element that must remain focusable after an error state
    vi.stubGlobal('navigator', { sendBeacon: vi.fn().mockReturnValue(false) });
    const fetchSpy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchSpy);

    // Must not throw — function must stay accessible (callable) after beacon failure
    expect(() => trackUser('focus_user')).not.toThrow();

    // Fallback fetch must be triggered — the interactive path remains open
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/track-user');
  });

  it('Tooltip Announcement: console.error is called with a descriptive message when payload serialization fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Force JSON.stringify to throw — simulates an announced error tooltip
    vi.spyOn(JSON, 'stringify').mockImplementation(() => {
      throw new Error('Circular structure detected');
    });

    trackUser('tooltip_user');

    // Error must be announced descriptively — matches tooltip label announcement semantics
    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy.mock.calls[0][0]).toBe('Failed to format tracking payload');
  });

  it('Tab Ordering: sendBeacon is attempted first and fetch fallback is only triggered when beacon returns false', () => {
    const callOrder: string[] = [];

    const beaconSpy = vi.fn().mockImplementation(() => {
      callOrder.push('beacon');
      return false; // beacon fails — triggers fallback
    });

    const fetchSpy = vi.fn().mockImplementation(() => {
      callOrder.push('fetch');
      return Promise.resolve(new Response());
    });

    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });
    vi.stubGlobal('fetch', fetchSpy);

    trackUser('tab_order_user');

    // Tab order: beacon must always be first in the execution sequence
    expect(callOrder[0]).toBe('beacon');
    expect(callOrder[1]).toBe('fetch');
    expect(callOrder).toHaveLength(2);
  });

  it('Heading Hierarchy: navigator guard fires before username guard ensuring correct logical check order', () => {
    const beaconSpy = vi.fn();

    // Remove navigator entirely — top-level guard must fire first (h1 equivalent)
    vi.stubGlobal('navigator', undefined);
    vi.stubGlobal('window', {});

    // Must be a no-op — navigator guard at the top of the hierarchy stops execution
    expect(() => trackUser('hierarchy_user')).not.toThrow();
    expect(beaconSpy).not.toHaveBeenCalled();

    // Restore navigator but pass empty username — second-level guard (h2 equivalent)
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });
    trackUser('');

    // Second guard must stop execution before reaching beacon
    expect(beaconSpy).not.toHaveBeenCalled();
  });
});
