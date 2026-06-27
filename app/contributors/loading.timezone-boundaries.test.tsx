import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Loading from './loading';
import { LOADING_ROOT_CLASSES } from './loadingClasses';
import '@testing-library/jest-dom';

describe('ContributorsLoading - Timezone Boundaries & Calendar Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // --- Test Case 1 ---
  it('renders loading elements timezone-agnostically across UTC, EST, IST, and JST', () => {
    const timezones = [0, 300, -330, -540]; // UTC offsets for UTC, EST, IST, and JST

    timezones.forEach((offset) => {
      vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offset);
      const { container } = render(<Loading />);

      // Ensure layout elements are present and unchanged
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Loading the collective...')).not.toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();

      // Clean up DOM and mocks between iterations
      cleanup();
      vi.restoreAllMocks();
    });
  });

  // --- Test Case 2 ---
  it('handles rendering and loads safely under leap year boundary system clocks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T23:59:59Z')); // Leap Day rollover

    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    vi.useRealTimers();
  });

  // --- Test Case 3 ---
  it('renders loading indicators safely during Daylight Saving Time (DST) transitions', () => {
    vi.useFakeTimers();
    // Simulate spring forward boundary transition
    vi.setSystemTime(new Date('2026-03-08T02:00:00Z'));

    render(<Loading />);
    expect(screen.queryByText('Loading the collective...')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  // --- Test Case 4 ---
  it('validates calendar date format utility stubs do not impact loading layout trees', () => {
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

    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Fetching contributor data from GitHub')).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  // --- Test Case 5 ---
  it('retains consistent alignment and status labels under JST/IST rollover times', () => {
    // Offset for JST (UTC+9)
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-540);
    const { container } = render(<Loading />);

    const layoutWrapper = container.firstChild as HTMLElement;
    expect(layoutWrapper).toHaveClass(...LOADING_ROOT_CLASSES);
  });
});
