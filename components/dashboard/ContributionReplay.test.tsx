import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContributionReplay from './ContributionReplay';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.whileInView;
      delete safeProps.viewport;
      delete safeProps.transition;
      return (
        <div
          className={className}
          data-testid={safeProps['data-testid'] || 'motion-div'}
          {...safeProps}
        >
          {children}
        </div>
      );
    },
    span: ({ children, ...props }: Record<string, unknown>) => (
      <span {...props}>{children as React.ReactNode}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Play: (props: Record<string, unknown>) => <div data-testid="icon-play" {...props} />,
  Pause: (props: Record<string, unknown>) => <div data-testid="icon-pause" {...props} />,
  RotateCcw: (props: Record<string, unknown>) => <div data-testid="icon-rotate" {...props} />,
  Calendar: (props: Record<string, unknown>) => <div data-testid="icon-calendar" {...props} />,
  Flame: (props: Record<string, unknown>) => <div data-testid="icon-flame" {...props} />,
}));

const mockActivity = [
  { date: '2025-01-05', count: 5, intensity: 1 as const },
  { date: '2025-01-10', count: 10, intensity: 4 as const }, // Peak day
  { date: '2025-02-15', count: 3, intensity: 2 as const },
  { date: '2025-03-20', count: 8, intensity: 3 as const },
];

describe('ContributionReplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the header title and description', () => {
    render(<ContributionReplay activity={mockActivity} />);

    expect(screen.getByText('Contribution Replay Timeline')).toBeDefined();
    expect(screen.getByText(/Animate your coding journey/)).toBeDefined();
  });

  it('renders the empty state fallback when no activity data is provided', () => {
    render(<ContributionReplay activity={[]} />);

    expect(screen.getByText('No contribution activity data available for replay.')).toBeDefined();
  });

  it('toggles play/pause state and correctly accumulates commits on tick', () => {
    render(<ContributionReplay activity={mockActivity} />);

    // Initial State: Month = January 2025, Commits = 15, Accumulated = 15
    expect(screen.getAllByText('January 2025')[0]).toBeDefined();

    // Click play button
    const playBtn = screen.getByLabelText('Play Replay');
    fireEvent.click(playBtn);

    // Play changes to Pause button
    expect(screen.getByLabelText('Pause Replay')).toBeDefined();

    // Tick 1 (1000ms): February 2025 (Monthly commits = 3, Accumulated commits = 18)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('February 2025')[0]).toBeDefined();
    expect(screen.getAllByText('3')[0]).toBeDefined(); // Monthly Commits
    expect(screen.getByText('18')).toBeDefined(); // Accumulated Commits

    // Tick 2 (1000ms): March 2025 (Monthly commits = 8, Accumulated commits = 26)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('March 2025')[0]).toBeDefined();
    expect(screen.getAllByText('8')[0]).toBeDefined();
    expect(screen.getByText('26')).toBeDefined();

    // Loop back: Tick 3 (1000ms) loops back to January 2025
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('January 2025')[0]).toBeDefined();

    // Pause the replay
    const pauseBtn = screen.getByLabelText('Pause Replay');
    fireEvent.click(pauseBtn);

    // Advancing timers should not change active month when paused
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('January 2025')[0]).toBeDefined();
  });

  it('resets playback index back to 0 on reset click', () => {
    render(<ContributionReplay activity={mockActivity} />);

    // Move forward
    const playBtn = screen.getByLabelText('Play Replay');
    fireEvent.click(playBtn);
    expect(screen.getByLabelText('Pause Replay')).toBeDefined();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('February 2025')[0]).toBeDefined();

    // Reset replay
    const resetBtn = screen.getByLabelText('Reset Replay');
    fireEvent.click(resetBtn);

    expect(screen.getAllByText('January 2025')[0]).toBeDefined();
    // Timer should also be stopped
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('January 2025')[0]).toBeDefined();
  });

  it('updates the month on timeline manual scrub slider input change', () => {
    render(<ContributionReplay activity={mockActivity} />);

    const scrubSlider = screen.getByLabelText('Scrub timeline months') as HTMLInputElement;

    // Move slider to index 2 (March 2025)
    fireEvent.change(scrubSlider, { target: { value: '2' } });

    expect(screen.getAllByText('March 2025')[0]).toBeDefined();
    expect(screen.getAllByText('8')[0]).toBeDefined(); // Monthly Commits
    expect(screen.getByText('26')).toBeDefined(); // Accumulated Commits
  });

  it('updates the month on speed index and speed multiplier change', () => {
    render(<ContributionReplay activity={mockActivity} />);

    // Verify default speed label
    expect(screen.getByText('1x')).toBeDefined();

    // Change speed via speed slider to 2x (index 1)
    const speedSlider = screen.getByLabelText(
      'Select playback speed multiplier'
    ) as HTMLInputElement;
    fireEvent.change(speedSlider, { target: { value: '1' } });

    expect(screen.getByText('2x')).toBeDefined();

    // Click play and verify tick speed is now 500ms
    const playBtn = screen.getByLabelText('Play Replay');
    fireEvent.click(playBtn);
    expect(screen.getByLabelText('Pause Replay')).toBeDefined();

    // Advance by 550ms -> should tick to February 2025
    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(screen.getAllByText('February 2025')[0]).toBeDefined();
  });

  it('supports keyboard accessibility for controls and navigation', () => {
    render(<ContributionReplay activity={mockActivity} />);

    // Controls should have tabIndex 0 and be natively focusable
    const playBtn = screen.getByLabelText('Play Replay');
    playBtn.focus();
    expect(document.activeElement).toBe(playBtn);

    const resetBtn = screen.getByLabelText('Reset Replay');
    resetBtn.focus();
    expect(document.activeElement).toBe(resetBtn);

    // Month Navigation list buttons
    const monthBtns = screen.getAllByLabelText(/Jump to/);
    expect(monthBtns.length).toBeGreaterThan(0);

    // Focus first month jump button
    monthBtns[1].focus();
    expect(document.activeElement).toBe(monthBtns[1]);

    // Keyboard click triggering month jump
    fireEvent.click(monthBtns[1]);
    expect(screen.getAllByText('February 2025')[0]).toBeDefined();
  });
});
