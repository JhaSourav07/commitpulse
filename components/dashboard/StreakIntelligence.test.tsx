import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StreakIntelligence from './StreakIntelligence';

// Mock framer-motion
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
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'dashboard.streak.title': 'GitHub Streak Intelligence',
        'dashboard.streak.subtitle':
          'Predictive modeling, survival rates, and recovery recommendations.',
        'dashboard.streak.probability_label': 'Survival Probability',
        'dashboard.streak.recovery_label': 'Recovery Insights',
        'dashboard.streak.milestone_label': 'Upcoming Streak Milestone',
        'dashboard.streak.days': 'Days',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

describe('StreakIntelligence Component', () => {
  const mockStats = {
    currentStreak: 5,
    peakStreak: 12,
    totalContributions: 50,
  };

  const mockActivity = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-06-${(i + 1).toString().padStart(2, '0')}`,
    count: i % 2 === 0 ? 3 : 0,
    intensity: (i % 2 === 0 ? 2 : 0) as 0 | 1 | 2 | 3 | 4,
  }));

  it('renders stats titles and cards correctly', () => {
    render(<StreakIntelligence activity={mockActivity} stats={mockStats} />);

    expect(screen.getByText('GitHub Streak Intelligence')).toBeDefined();
    expect(screen.getByText('Survival Probability')).toBeDefined();
    expect(screen.getByText('Recovery Insights')).toBeDefined();
    expect(screen.getByText('Upcoming Streak Milestone')).toBeDefined();
  });

  it('displays calculated survival rate and milestones correctly', () => {
    render(<StreakIntelligence activity={mockActivity} stats={mockStats} />);

    // Since mock activity has 50% activity, survival likelihood is computed
    expect(screen.queryByText(/%/)).not.toBeNull();
    // Peak streak is 12, which should be the upcoming milestone
    expect(screen.getByText('12 Days')).toBeDefined();
  });
});
