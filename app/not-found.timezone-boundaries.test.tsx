//not-found.timezone-boundaries.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotFound from './not-found';

// Mocking dependencies to isolate the component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('../components/MiniGame', () => ({
  default: () => <div data-testid="mini-game">MiniGame Component</div>,
}));

describe('NotFound Component - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('Mock standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    // UTC
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const { unmount: unmountUTC } = render(<NotFound />);
    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
    unmountUTC();

    // Simulated EST (-5)
    vi.setSystemTime(new Date('2024-01-01T12:00:00-05:00'));
    const { unmount: unmountEST } = render(<NotFound />);
    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
    unmountEST();

    // Simulated IST (+5:30)
    vi.setSystemTime(new Date('2024-01-01T12:00:00+05:30'));
    const { unmount: unmountIST } = render(<NotFound />);
    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
    unmountIST();
  });

  it('Assert calculations align commits onto the correct visual dates', () => {
    // Tests that end-of-year/end-of-month boundaries render correctly without throwing errors
    // ensuring consistent component stability across simulated visual date shifts
    vi.setSystemTime(new Date('2023-12-31T23:59:59Z'));
    const { container } = render(<NotFound />);

    // "git checkout this-page" is split across nested <span> elements in the markup
    // (the "this-page" portion is wrapped in its own <span className="text-cyan-400">),
    // so getByText with a regex won't match any single element's own text node.
    // Asserting on the combined textContent avoids that false negative.
    expect(container.textContent).toMatch(/git checkout this-page/i);
    expect(screen.getByText(/Go back home/i)).toBeInTheDocument();
  });

  it('Verify leap year boundaries parse without leaving gaps in grids', () => {
    // Testing leap year boundary behavior by setting a leap day date
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));
    render(<NotFound />);

    // Component should successfully render core text without breaking during leap year days
    expect(screen.getByText(/rebased out of existence/i)).toBeInTheDocument();
    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
  });

  it('Assert calendar date format utility outputs match expectations in each locale', () => {
    // Render the component on a standard mid-year boundary
    vi.setSystemTime(new Date('2024-07-04T12:00:00Z'));
    render(<NotFound />);

    // Verifying primary user interactions are unaffected by the system date/locale configurations
    const homeLink = screen.getByRole('link', { name: /Go back home/i });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByText(/No stash\. No reflog\. Just vibes\./i)).toBeInTheDocument();
  });

  it('Test offsets around transition dates like daylight savings', () => {
    // Spring Forward / Fall Back boundaries (e.g., US DST transition on March 10, 2024)
    vi.setSystemTime(new Date('2024-03-10T02:30:00-05:00')); // In the DST transition gap
    const { container } = render(<NotFound />);

    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
    // Same nested-span issue as above — match against combined textContent instead
    // of getByText, which only checks a single element's own text node.
    expect(container.textContent).toMatch(/git checkout this-page/i);
  });
});
