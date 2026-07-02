import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UnifiedIntelligenceCenter from './UnifiedIntelligenceCenter';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('UnifiedIntelligenceCenter', () => {
  const mockProfile = {
    username: 'testuser',
    developerScore: 85,
  };
  const mockStats = {
    totalContributions: 2000,
    currentStreak: 15,
  };

  it('renders the executive intelligence summary', () => {
    render(<UnifiedIntelligenceCenter profile={mockProfile} stats={mockStats} />);
    expect(screen.getByText('Executive Intelligence Summary')).toBeTruthy();
  });

  it('displays the global score', () => {
    render(<UnifiedIntelligenceCenter profile={mockProfile} stats={mockStats} />);
    expect(screen.getByText('Global Score: 85')).toBeTruthy();
  });

  it('renders the three main executive metric cards', () => {
    render(<UnifiedIntelligenceCenter profile={mockProfile} stats={mockStats} />);
    expect(screen.getByText('Productivity Velocity')).toBeTruthy();
    expect(screen.getByText('Community Impact')).toBeTruthy();
    expect(screen.getByText('Code Quality & Health')).toBeTruthy();
  });

  it('renders the AI cross-metric analysis text', () => {
    render(<UnifiedIntelligenceCenter profile={mockProfile} stats={mockStats} />);
    expect(screen.getByText('AI Cross-Metric Analysis')).toBeTruthy();
    expect(screen.getByText(/2000 total contributions/)).toBeTruthy();
  });
});
