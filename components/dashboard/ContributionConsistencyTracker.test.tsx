import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ContributionConsistencyTracker from './ContributionConsistencyTracker';

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
        'dashboard.consistency.title': 'Contribution Consistency Tracker',
        'dashboard.consistency.subtitle':
          'Track your commit streaks, weekday activity bias, and yearly stability trends.',
        'dashboard.consistency.no_data': 'No consistency data available.',
        'dashboard.consistency.active_streak': 'Active Streak',
        'dashboard.consistency.peak_streak': 'Peak Streak',
        'dashboard.consistency.weekday_bias': 'Activity Bias',
        'dashboard.consistency.weekday_value': 'Weekdays',
        'dashboard.consistency.weekend_value': 'Weekends',
        'dashboard.consistency.days': 'Days',
        'dashboard.consistency.stability': 'Stability Index',
        'dashboard.consistency.bias_warrior': 'Weekday Warrior',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

describe('ContributionConsistencyTracker Component', () => {
  const mockActivity = [
    { date: '2026-06-01', count: 5, intensity: 1 as const }, // Monday
    { date: '2026-06-02', count: 3, intensity: 1 as const }, // Tuesday
    { date: '2026-06-03', count: 0, intensity: 0 as const }, // Wednesday
    { date: '2026-06-04', count: 10, intensity: 2 as const }, // Thursday
    { date: '2026-06-05', count: 12, intensity: 2 as const }, // Friday
    { date: '2026-06-06', count: 0, intensity: 0 as const }, // Saturday
    { date: '2026-06-07', count: 0, intensity: 0 as const }, // Sunday
  ];

  it('renders default title and elements correctly', () => {
    render(<ContributionConsistencyTracker activity={mockActivity} />);

    expect(screen.getByText('Contribution Consistency Tracker')).toBeDefined();
    expect(screen.getByText('Active Streak')).toBeDefined();
    expect(screen.getByText('Activity Bias')).toBeDefined();
    expect(screen.getByText('Stability Index')).toBeDefined();
  });

  it('calculates streaks and activity bias correctly', () => {
    render(<ContributionConsistencyTracker activity={mockActivity} />);

    // Check that Peak Streak label is rendered
    expect(screen.getByText(/Peak Streak/)).toBeDefined();
    expect(screen.getByText('Weekday Warrior')).toBeDefined();
  });
});
