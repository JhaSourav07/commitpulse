import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import CommitClock from './CommitClock';
import type { CommitClockData } from '@/types/dashboard';

// 1. Mock framer-motion to prevent animation errors during DOM testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    g: ({ children }: { children: ReactNode }) => <g>{children}</g>,
  },
}));

describe('CommitClock', () => {
  // Helper to generate properly typed mock data
  const generateMockData = (commits: number): CommitClockData[] => [
    { day: 'Sun', commits },
    { day: 'Mon', commits },
    { day: 'Tue', commits },
    { day: 'Wed', commits },
    { day: 'Thu', commits },
    { day: 'Fri', commits },
    { day: 'Sat', commits },
  ];

  it("renders 'Commit Clock' heading", () => {
    render(<CommitClock data={generateMockData(5)} />);
    expect(screen.getByRole('heading', { name: /commit clock/i })).toBeDefined();
  });

  it("renders 'Weekly activity cycle' subtitle", () => {
    render(<CommitClock data={generateMockData(5)} />);
    expect(screen.getByText(/weekly activity cycle/i)).toBeDefined();
  });

  it('renders all 7 day labels', () => {
    render(<CommitClock data={generateMockData(5)} />);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach((day) => {
      expect(screen.getByText(day)).toBeDefined();
    });
  });

  it('renders an SVG element', () => {
    const { container } = render(<CommitClock data={generateMockData(5)} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders with all-zero commit data without crashing', () => {
    expect(() => render(<CommitClock data={generateMockData(0)} />)).not.toThrow();
  });
});
