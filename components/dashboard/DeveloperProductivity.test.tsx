import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeveloperProductivity from './DeveloperProductivity';

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
      delete safeProps.animate;
      delete safeProps.transition;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'dashboard.productivity.title': 'Developer Productivity Intelligence',
        'dashboard.productivity.subtitle':
          'Analyze your coding rhythm, active hours, and weekly velocity patterns.',
        'dashboard.productivity.tabs.rhythm': 'Rhythm',
        'dashboard.productivity.tabs.hours': 'Active Hours',
        'dashboard.productivity.tabs.weekly': 'Weekly Velocity',
        'dashboard.productivity.metrics.rhythm_score': 'Rhythm Score',
        'dashboard.productivity.metrics.rhythm_type': 'Coding Style',
        'dashboard.productivity.metrics.variance': 'Activity variance',
        'dashboard.productivity.metrics.consistency': 'Consistency Metrics',
        'dashboard.productivity.metrics.active_days': 'Active Days',
        'dashboard.productivity.metrics.commits_active_day': 'Avg Commits / Active Day',
        'dashboard.productivity.metrics.active_days_ratio_desc':
          'Days with contributions normalized over total tracking period.',
        'dashboard.productivity.chronotypes.night_owl.title': 'Night Owl',
        'dashboard.productivity.chronotypes.early_bird.title': 'Early Bird',
        'dashboard.productivity.chronotypes.standard.title': 'Standard Developer',
        'dashboard.productivity.rhythm.steady_builder.title': 'Steady Builder',
        'dashboard.productivity.rhythm.sprint_coder.title': 'Sprint Coder',
        'dashboard.productivity.weekly.title': '12-Week Coding Rhythm',
        'dashboard.productivity.weekly.peak': 'Peak Week',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

describe('DeveloperProductivity Component', () => {
  const usernameNightOwl = 'bhuvanesh'; // Adjust based on userHash % 3
  const usernameEarlyBird = 'saidai';
  const usernameStandard = 'some-user';

  const mockActivitySteady = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-06-${(i + 1).toString().padStart(2, '0')}`,
    count: 2, // zero variance
    intensity: 1 as const,
  }));

  const mockActivityBursty = [
    { date: '2026-06-01', count: 20, intensity: 4 as const },
    { date: '2026-06-02', count: 0, intensity: 0 as const },
    { date: '2026-06-03', count: 0, intensity: 0 as const },
    { date: '2026-06-04', count: 15, intensity: 3 as const },
  ];

  const mockCommitClock = [
    { day: 'Sun', commits: 5 },
    { day: 'Mon', commits: 10 },
  ];

  it('renders default title and tabs correctly', () => {
    render(
      <DeveloperProductivity
        username={usernameNightOwl}
        activity={mockActivitySteady}
        commitClock={mockCommitClock}
      />
    );

    expect(screen.getByText('Developer Productivity Intelligence')).toBeDefined();
    expect(
      screen.getByText('Analyze your coding rhythm, active hours, and weekly velocity patterns.')
    ).toBeDefined();

    // Verify tabs are present
    expect(screen.getByText('Rhythm')).toBeDefined();
    expect(screen.getByText('Active Hours')).toBeDefined();
    expect(screen.getByText('Weekly Velocity')).toBeDefined();
  });

  it('classifies steady builder styling correctly', () => {
    render(
      <DeveloperProductivity
        username={usernameNightOwl}
        activity={mockActivitySteady}
        commitClock={mockCommitClock}
      />
    );

    // Active days ratio: 30/30 = 100% (>40%), variance = 0 (<2.0)
    expect(screen.getByText('Steady Builder')).toBeDefined();
    expect(screen.getByText('Rhythm Score')).toBeDefined();
  });

  it('classifies sprint coder styling correctly for bursty/low activity', () => {
    render(
      <DeveloperProductivity
        username={usernameNightOwl}
        activity={mockActivityBursty}
        commitClock={mockCommitClock}
      />
    );

    // High variance/low consistency ratio
    expect(screen.getByText('Sprint Coder')).toBeDefined();
  });

  it('navigates between panels correctly using tabs', () => {
    render(
      <DeveloperProductivity
        username={usernameNightOwl}
        activity={mockActivitySteady}
        commitClock={mockCommitClock}
      />
    );

    // Default tab is 'rhythm'
    expect(screen.queryByText('12-Week Coding Rhythm')).toBeNull();

    // Click Active Hours tab
    fireEvent.click(screen.getByText('Active Hours'));
    expect(screen.queryByText('Rhythm Score')).toBeNull();

    // Click Weekly Velocity tab
    fireEvent.click(screen.getByText('Weekly Velocity'));
    expect(screen.getByText('12-Week Coding Rhythm')).toBeDefined();
  });
});
