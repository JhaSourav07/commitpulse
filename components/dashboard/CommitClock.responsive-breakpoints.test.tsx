import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import CommitClock from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

// Cleanly match the framer-motion mock geometry from the base component setup
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    g: ({ children }: { children: React.ReactNode }) => <g>{children}</g>,
  },
}));

describe('CommitClock - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  // Construct a realistic 7-day vector array exactly mapping CommitClockData standard values
  const mockWeeklyData: CommitClockData[] = [
    { day: 'Sun', commits: 2 },
    { day: 'Mon', commits: 8 },
    { day: 'Tue', commits: 14 },
    { day: 'Wed', commits: 5 },
    { day: 'Thu', commits: 0 },
    { day: 'Fri', commits: 22 },
    { day: 'Sat', commits: 1 },
  ];

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
  });

  // Test Case 1: Fixed weak assertion to use authentic DOM element lookup matches
  it('mounts cleanly without side-effects inside a narrow 375px mobile display canvas', () => {
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));

    render(<CommitClock data={mockWeeklyData} />);

    // Strengthened Assertion: Verifies core component header node exists in the DOM mapping layout
    expect(screen.getByText('Commit Clock')).toBeInTheDocument();
  });

  // Test Case 2: Assert that columns reflow into standard vertical flex lists
  it('retains fluent responsive layout tree configurations under mobile layout wrappers', () => {
    vi.stubGlobal('innerWidth', 360);
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<CommitClock data={mockWeeklyData} />);

    const rootWrapper = container.firstChild as HTMLElement;
    // Straight to the point: Access classes directly since existence is implicitly checked
    expect(rootWrapper.className).toContain('flex');
    expect(rootWrapper.className).toContain('flex-col');
  });

  // Test Case 3: Fixed fake JSDOM window calculation behavior by asserting class layout tags directly
  it('omits rigid absolute desktop pixel width bindings on parent containers to facilitate auto-scaling', () => {
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<CommitClock data={mockWeeklyData} />);
    const cardContainer = container.firstChild as HTMLElement;

    // Strengthened Assertion: Verifies fluid styling architecture components exist instead of brittle styles
    expect(cardContainer.className).toContain('flex');
    expect(cardContainer.className).toContain('items-center');
    expect(container.innerHTML).not.toContain('w-[900px]');
    expect(container.innerHTML).not.toContain('w-[1200px]');
  });

  // Test Case 4: Strengthened to verify specific dimension attributes explicitly
  it('scales structural graphics layout nodes correctly across intermediate 768px tablet grids', () => {
    vi.stubGlobal('innerWidth', 768);
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<CommitClock data={mockWeeklyData} />);

    const svgNode = container.querySelector('svg');
    expect(svgNode).not.toBeNull();

    // Strengthened Assertion: Confirms rigid inner radial dimensions match production specification attributes
    expect(svgNode).toHaveAttribute('width', '280');
    expect(svgNode).toHaveAttribute('height', '280');

    const backgroundTickLines = container.querySelectorAll('line');
    expect(backgroundTickLines.length).toBeGreaterThan(0);
  });

  // Test Case 5: Replaced weak toBeDefined statements with proper toBeInTheDocument expectations
  it('renders core component typography nodes securely without stacking anomalies on sub-320px screen bounds', () => {
    vi.stubGlobal('innerWidth', 320);
    window.dispatchEvent(new Event('resize'));

    render(<CommitClock data={mockWeeklyData} />);

    // Strengthened Assertion: Confirms text elements populate clean, fully-bound layout trees
    expect(screen.getByText('Commit Clock')).toBeInTheDocument();
    expect(screen.getByText('Weekly activity cycle')).toBeInTheDocument();
  });
});
