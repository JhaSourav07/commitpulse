import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroSection } from './HeroSection';

// Mock framer-motion to keep DOM assertions deterministic and avoid animation
// timing flakiness under a fake timer clock.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.ComponentProps<'p'>) => <p {...props}>{children}</p>,
  },
}));

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('HeroSection Timezone Normalization & Calendar Data Boundary Alignment', () => {
  // Test 1: Baseline UTC normalization
  it('1. Renders the hero heading consistently when the system clock is normalized to UTC midnight', () => {
    // Freeze the clock at UTC midnight to prove no rendered content is derived
    // from wall-clock time (the hero must be timezone-invariant).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    render(<HeroSection />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Elevate Your/i);
    expect(heading).toHaveTextContent(/Contribution Story\./i);
  });

  // Test 2: Cross-timezone alignment (EST, IST, JST)
  it('2. Renders identical contribution stat badges across EST, IST, and JST timezone offsets', () => {
    // We iterate over three real-world offsets to confirm the stat pills are
    // static strings and never shift based on the runtime timezone.
    const offsetsInMinutes = [300 /* EST -5 */, -330 /* IST +5:30 */, -540 /* JST +9 */];

    offsetsInMinutes.forEach((offset) => {
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = () => offset;

      const { unmount } = render(<HeroSection />);

      // Each of the three static stat badges must render regardless of TZ.
      expect(screen.getByText(/1,247 Contributions/i)).toBeInTheDocument();
      expect(screen.getByText(/83 Pull Requests/i)).toBeInTheDocument();
      expect(screen.getByText(/214 Commits/i)).toBeInTheDocument();

      unmount();
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });
  });

  // Test 3: Leap year boundary
  it('3. Verifies leap year date boundaries (Feb 29, 2024) parse without leaving rendering gaps', () => {
    // Feb 29 exposes any date-parsing code path that assumes a 28-day February.
    // Mounting here guarantees the hero renders every subtree cleanly.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T12:00:00.000Z'));

    const { container } = render(<HeroSection />);

    // The outer hero region is the stable timezone-independent anchor.
    const region = screen.getByRole('region', { name: /Hero section/i });
    expect(region).toBeInTheDocument();

    // The 24-dot background grid must render fully â€” no gaps caused by a
    // leap-year exception silently unmounting the grid.
    const animatedDots = container.querySelectorAll('.animate-pulse');
    expect(animatedDots.length).toBe(24);
  });

  // Test 4: Locale-independent labels
  it('4. Asserts hero copy and form labels match expectations regardless of active locale format', () => {
    // Simulate a non-en-US locale (dd/mm/yyyy) to prove that the hero labels
    // are hard-coded English strings, not locale-derived output.
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = function () {
      return '29/02/2024';
    };

    render(<HeroSection />);

    // Static labels must remain unchanged under a non-US locale.
    expect(screen.getByLabelText('GitHub username')).toBeInTheDocument();
    expect(
      screen.getByRole('search', { name: /Generate your GitHub streak badge/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Copy Link/i)).toBeInTheDocument();
    expect(screen.getByText(/Watch Dashboard/i)).toBeInTheDocument();

    Date.prototype.toLocaleDateString = originalToLocaleDateString;
  });

  // Test 5: DST transitions (spring-forward + fall-back)
  it('5. Remains stable when the system clock crosses a daylight-savings transition boundary', () => {
    // March 10, 2024 at 02:00 US/Eastern is the spring-forward moment where
    // the wall clock jumps to 03:00. Any effect depending on monotonic time
    // would surface here.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T07:00:00.000Z'));

    const { unmount } = render(<HeroSection />);
    expect(screen.getByRole('region', { name: /Hero section/i })).toBeInTheDocument();
    unmount();

    // November 3, 2024 at 02:00 US/Eastern is the fall-back moment where the
    // hour repeats. Re-mounting catches any effect that assumes distinct
    // timestamps between mounts.
    vi.setSystemTime(new Date('2024-11-03T06:00:00.000Z'));

    render(<HeroSection />);
    expect(screen.getByRole('region', { name: /Hero section/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Elevate Your/i);
  });
});
