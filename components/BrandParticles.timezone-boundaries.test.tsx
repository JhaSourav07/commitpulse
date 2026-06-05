import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import BrandParticles from './BrandParticles';

// Mock framer-motion to control particles rendering and inspect attributes
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      animate,
      transition,
      style,
      ...props
    }: {
      animate?: unknown;
      transition?: unknown;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div
        {...props}
        style={style}
        data-testid="motion-div"
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
      />
    ),
  },
  useReducedMotion: () => false,
}));

describe('BrandParticles - Timezone Boundaries & Calendar Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // --- Test Case 1 ---
  it('renders successfully across multiple timezone offsets (UTC, EST, IST, JST)', () => {
    const timezones = [0, 300, -330, -540]; // Offsets in minutes

    timezones.forEach((offset) => {
      vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offset);
      const { unmount } = render(<BrandParticles />);

      const particles = screen.getAllByTestId('motion-div');
      expect(particles).toHaveLength(40);

      unmount();
      vi.restoreAllMocks();
    });
  });

  // --- Test Case 2 ---
  it('renders correctly under leap year boundary system clocks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T23:59:59Z')); // Leap day rollover

    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');
    expect(particles).toHaveLength(40);

    vi.useRealTimers();
  });

  // --- Test Case 3 ---
  it('retains visual animation paths during Daylight Saving Time (DST) transitions', () => {
    vi.useFakeTimers();
    // Simulate spring forward transition
    vi.setSystemTime(new Date('2026-03-08T02:00:00Z'));

    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');
    expect(particles).toHaveLength(40);

    // Verify visual animate parameters are generated and valid
    const firstParticle = particles[0];
    const animateAttr = firstParticle.getAttribute('data-animate');
    expect(animateAttr).toContain('y');
    expect(animateAttr).toContain('x');
    expect(animateAttr).toContain('rotate');

    vi.useRealTimers();
  });

  // --- Test Case 4 ---
  it('validates calendar date format utility stubs do not impact layout mounting tree', () => {
    // Mock standard DateTimeFormat to emulate locale-specific changes
    const mockDateTimeFormat = function () {
      return {
        format: () => '01/01/2026',
        resolvedOptions: () =>
          ({ locale: 'en-US', timeZone: 'UTC' }) as Intl.ResolvedDateTimeFormatOptions,
      };
    } as unknown as typeof Intl.DateTimeFormat;

    vi.stubGlobal('Intl', {
      ...Intl,
      DateTimeFormat: mockDateTimeFormat,
    });

    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');
    expect(particles).toHaveLength(40);

    vi.unstubAllGlobals();
  });

  // --- Test Case 5 ---
  it('remains visual-stable and aligned when timezone offset shifts dynamically', () => {
    // Start with EST offset
    const offsetSpy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);
    const { rerender } = render(<BrandParticles />);

    let particles = screen.getAllByTestId('motion-div');
    expect(particles).toHaveLength(40);

    // Shift to JST offset dynamically
    offsetSpy.mockReturnValue(-540);
    rerender(<BrandParticles />);

    particles = screen.getAllByTestId('motion-div');
    expect(particles).toHaveLength(40);
  });
});
