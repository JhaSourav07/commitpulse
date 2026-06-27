// components/dashboard/CommitClock.accessibility.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommitClock from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    g: ({ children, ...props }: React.SVGProps<SVGGElement>) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CommitClock - Accessibility & Screen Reader Aria Compliance', () => {
  // Stable 7-day dataset so the assertions on role/aria/tab order are deterministic
  const data: CommitClockData[] = [
    { day: 'Sun', commits: 1 },
    { day: 'Mon', commits: 2 },
    { day: 'Tue', commits: 3 },
    { day: 'Wed', commits: 4 },
    { day: 'Thu', commits: 5 },
    { day: 'Fri', commits: 6 },
    { day: 'Sat', commits: 7 },
  ];

  let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    // The showTooltip handler in CommitClock reads getBoundingClientRect to position itself;
    // stub it so focus interactions can resolve coordinates inside jsdom.
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 100,
      top: 50,
      left: 50,
      bottom: 150,
      right: 150,
      x: 50,
      y: 50,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    vi.restoreAllMocks();
  });

  it('exposes each weekday group as an img role with a descriptive aria-label', () => {
    const { container } = render(<CommitClock data={data} />);

    const groups = container.querySelectorAll('g[role="img"][aria-label]');

    expect(groups.length).toBe(7);
    groups.forEach((group) => {
      const label = group.getAttribute('aria-label') ?? '';

      // Each label must mention a weekday and a contribution count so screen
      // readers announce the right cell.
      expect(label).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat):/);
      expect(label).toMatch(/contribution/);
    });
  });

  it('makes every spoke group focusable and pins its outline behavior', () => {
    const { container } = render(<CommitClock data={data} />);

    const groups = container.querySelectorAll('g[role="img"][aria-label]');

    expect(groups.length).toBe(7);
    groups.forEach((group) => {
      // Spoke groups must participate in the tab order (tabIndex=0) so keyboard
      // users can reach them, and the outline class is what makes the focus
      // ring visible against the dark canvas.
      expect(group.getAttribute('tabindex')).toBe('0');
      expect(String(group.getAttribute('class') ?? '')).toContain('outline-none');
    });
  });

  it('announces the tooltip with role="tooltip" and the day title on focus', async () => {
    const { container } = render(<CommitClock data={data} />);

    const wedSpoke = Array.from(container.querySelectorAll('g[role="img"]')).find((g) =>
      (g.getAttribute('aria-label') ?? '').startsWith('Wed:')
    );

    expect(wedSpoke).toBeDefined();

    fireEvent.focus(wedSpoke as Element);

    const tooltip = await screen.findByRole('tooltip');

    expect(tooltip).toBeInTheDocument();
    // The tooltip title is the localized "day activity" string used by CommitClock
    expect(tooltip).toHaveTextContent(/Wed activity/);
  });

  it('preserves chronological tab order across the seven weekday groups', () => {
    const { container } = render(<CommitClock data={data} />);

    const focusable = Array.from(
      container.querySelectorAll('g[role="img"][aria-label][tabindex="0"]')
    ) as HTMLElement[];

    expect(focusable.length).toBe(7);

    // Document order must mirror data order so the keyboard tab order matches
    // the visual week: Sun → Mon → ... → Sat.
    const days = focusable.map((g) => (g.getAttribute('aria-label') ?? '').split(':')[0]);

    expect(days).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('renders a single semantic heading at the correct hierarchical level', () => {
    render(<CommitClock data={data} />);

    const heading = screen.getByRole('heading', { name: /commit clock/i });

    expect(heading).toBeInTheDocument();
    // h3 is the contract used by CommitClock — anything else would skip levels
    // relative to the parent dashboard layout.
    expect(heading.tagName.toLowerCase()).toBe('h3');
  });
});
