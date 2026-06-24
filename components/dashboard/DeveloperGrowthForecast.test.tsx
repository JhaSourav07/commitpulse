import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeveloperGrowthForecast from './DeveloperGrowthForecast';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('DeveloperGrowthForecast', () => {
  const mockStats = {
    totalContributions: 1500,
    currentStreak: 10,
    peakStreak: 50,
  };
  const mockJoinedDate = '2020-01-01T00:00:00Z';

  it('renders the growth forecast component', () => {
    render(<DeveloperGrowthForecast stats={mockStats} joinedDate={mockJoinedDate} />);
    expect(screen.getByText('Developer Growth Forecast')).toBeTruthy();
  });

  it('calculates the next milestone correctly', () => {
    render(<DeveloperGrowthForecast stats={mockStats} joinedDate={mockJoinedDate} />);
    // Next milestone after 1500 is 2000
    expect(screen.getByText('2,000')).toBeTruthy();
  });

  it('renders without crashing on 0 contributions', () => {
    render(
      <DeveloperGrowthForecast
        stats={{ totalContributions: 0, currentStreak: 0, peakStreak: 0 }}
        joinedDate={new Date().toISOString()}
      />
    );
    expect(screen.getByText('Developer Growth Forecast')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy(); // Next milestone
  });
});
