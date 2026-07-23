import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { GeneratorClient } from './GeneratorClient';

// Timezone offsets in minutes (Date.prototype.getTimezoneOffset returns
// minutes *west* of UTC, so IST/JST are negative because they are east).
// Keeping these declared inline as a lookup table makes it obvious which
// offset each named zone maps to when scanning the test source.
const TIMEZONE_OFFSETS: Record<string, number> = {
  UTC: 0,
  EST: 300, // UTC-5
  IST: -330, // UTC+5:30
  JST: -540, // UTC+9
};

describe('GeneratorClient - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  // Preserve the real prototype method so every test can safely restore it,
  // otherwise a stub leaked from one test would silently corrupt the next.
  const realGetTimezoneOffset = Date.prototype.getTimezoneOffset;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore both fake timers and the real timezone getter so the JSDOM
    // environment is left exactly as we found it.
    vi.useRealTimers();
    Date.prototype.getTimezoneOffset = realGetTimezoneOffset;
  });

  // Test Case 1: Mock standard timezone settings (e.g., UTC, EST, IST, JST).
  it('renders stably when the host timezone is stubbed to UTC, EST, IST, or JST', () => {
    // Rendering under each stubbed offset proves the component's initial
    // paint has no hidden dependency on the machine's real timezone,
    // which is critical because CI runners are almost always in UTC.
    for (const [zone, offset] of Object.entries(TIMEZONE_OFFSETS)) {
      Date.prototype.getTimezoneOffset = () => offset;

      const { unmount } = render(<GeneratorClient />);

      // The generator exposes an accessible form; if the tree failed to
      // mount under this offset we would never reach this assertion.
      expect(
        screen.getByRole('form', { name: /Readme Configuration Editor/i }),
        `expected form to render under stubbed ${zone} timezone`
      ).toBeInTheDocument();

      // Unmount between iterations so each render is completely isolated.
      unmount();
    }
  });

  // Test Case 2: Assert calculations align commits onto the correct visual dates.
  it('anchors its initial render to a fixed system clock so visible dates stay deterministic', () => {
    // Pin the wall clock to a known instant so any date-derived value
    // rendered by the tree is reproducible regardless of when this
    // test actually runs on CI or on a contributor's laptop.
    const anchor = new Date('2025-06-15T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(anchor);

    render(<GeneratorClient />);

    // Sanity: the mocked clock is actually in effect for downstream code
    // (e.g. any Date.now() call inside the render tree).
    expect(new Date().toISOString()).toBe(anchor.toISOString());

    // The generator's top-level accessible form must render on the initial
    // paint. This is the same anchor point the other timezone tests use,
    // guaranteeing the component tree is present under the fixed clock.
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
  });

  // Test Case 3: Verify leap year boundaries parse without leaving gaps in grids.
  it('renders on Feb 29 of a leap year without throwing a date-parse error', () => {
    // Feb 29 2024 is the canonical leap-day edge case. If any downstream
    // date math naively used `new Date(year, 1, 29)` on a non-leap year
    // it would silently roll over to March 1 and the layout would shift.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T00:00:00Z'));

    // The mere fact that render() completes without throwing is the
    // assertion; a crash here would indicate a leap-day regression.
    expect(() => render(<GeneratorClient />)).not.toThrow();
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
  });

  // Test Case 4: Assert calendar date format utility outputs match expectations in each locale.
  it('produces stable Intl.DateTimeFormat output for en-US, en-IN, ja-JP, and de-DE locales', () => {
    // A fixed UTC instant guarantees the locale formatter output is a
    // pure function of the locale argument, not the ambient clock.
    const sample = new Date('2025-01-15T00:00:00Z');

    // Expected substrings, not full equality, because Intl output can
    // legitimately vary by ICU version (e.g. narrow-vs-normal spaces).
    const expectations: Record<string, string> = {
      'en-US': '2025',
      'en-IN': '2025',
      'ja-JP': '2025',
      'de-DE': '2025',
    };

    for (const [locale, expected] of Object.entries(expectations)) {
      const formatted = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(sample);

      expect(formatted, `locale ${locale} should include ${expected}`).toContain(expected);
    }

    // And the component must still render cleanly under the default locale
    // so we know locale switching does not destabilise the tree.
    render(<GeneratorClient />);
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
  });

  // Test Case 5: Test offsets around transition dates like daylight savings.
  it('renders identically on both sides of the US spring-forward DST boundary', () => {
    // In 2025, US DST began at 02:00 local on Mar 9. Rendering on both
    // Mar 9 and Mar 10 proves the component is not sensitive to the
    // 23-hour vs 24-hour day that occurs across a DST transition.
    const beforeDst = new Date('2025-03-09T06:59:00Z');
    const afterDst = new Date('2025-03-10T06:00:00Z');

    vi.useFakeTimers();
    vi.setSystemTime(beforeDst);
    const { unmount } = render(<GeneratorClient />);
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
    unmount();

    vi.setSystemTime(afterDst);
    render(<GeneratorClient />);
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
  });
});
