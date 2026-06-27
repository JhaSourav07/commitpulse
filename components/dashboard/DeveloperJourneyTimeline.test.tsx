import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeveloperJourneyTimeline from './DeveloperJourneyTimeline';
import type { Achievement } from '@/types/dashboard';

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
      delete safeProps.layout;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'dashboard.journey.title': 'Developer Journey Timeline',
        'dashboard.journey.subtitle': 'Visualize complete developer evolution history',
        'dashboard.journey.firstCommit': 'First Commit',
        'dashboard.journey.peakDay': 'Peak Day',
        'dashboard.journey.milestone50': 'Bronze Contributor',
        'dashboard.journey.milestone100': 'Silver Contributor',
        'dashboard.journey.milestone500': 'Gold Contributor',
        'dashboard.journey.milestone1000': 'Diamond Contributor',
        'dashboard.journey.noActivity': 'No activity recorded yet for this journey',
      };

      let val = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(`{{${k}}}`, String(v));
        });
      }
      return val;
    },
  }),
}));

describe('DeveloperJourneyTimeline Component', () => {
  const mockActivity = [
    { date: '2026-01-01', count: 5, intensity: 1 },
    { date: '2026-02-01', count: 12, intensity: 2 },
    { date: '2026-03-01', count: 45, intensity: 4 }, // Peak day (45 commits)
    { date: '2026-04-01', count: 10, intensity: 1 },
  ];

  const mockAchievements: Achievement[] = [
    {
      id: 'first-contrib',
      title: 'First Contribution Badge',
      description: 'You made your first contribution!',
      icon: 'star',
      isUnlocked: true,
      type: 'contributions',
      threshold: 1,
      currentValue: 72,
      progress: 100,
    },
    {
      id: 'locked-badge',
      title: 'Super Coder',
      description: 'Complete 1000 commits',
      icon: 'shield',
      isUnlocked: false,
      type: 'contributions',
      threshold: 1000,
      currentValue: 72,
      progress: 7.2,
    },
  ];

  it('renders correct fallback message when activity is empty', () => {
    render(<DeveloperJourneyTimeline activity={[]} achievements={[]} />);
    expect(screen.getByText('No activity recorded yet for this journey')).toBeDefined();
  });

  it('renders title, subtitle, and filters correctly', () => {
    render(<DeveloperJourneyTimeline activity={mockActivity} achievements={mockAchievements} />);

    expect(screen.getByText('Developer Journey Timeline')).toBeDefined();
    expect(screen.getByText('Visualize complete developer evolution history')).toBeDefined();
    expect(screen.getByRole('button', { name: 'All' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Milestones' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Achievements' })).toBeDefined();
  });

  it('generates, sorts, and renders landmark events correctly', () => {
    render(<DeveloperJourneyTimeline activity={mockActivity} achievements={mockAchievements} />);

    // First commit check
    expect(screen.getByText('First Commit')).toBeDefined();

    // Peak day check
    expect(screen.getByText('Peak Day')).toBeDefined();

    // Growth milestone check: total at 2026-03-01 is 5 + 12 + 45 = 62 (which crosses 50 commits)
    expect(screen.getByText('Bronze Contributor')).toBeDefined();

    // Achievement check
    expect(screen.getByText('First Contribution Badge')).toBeDefined();
    // Locked achievement should NOT be rendered
    expect(screen.queryByText('Super Coder')).toBeNull();
  });

  it('filters events when selecting filter buttons', () => {
    render(<DeveloperJourneyTimeline activity={mockActivity} achievements={mockAchievements} />);

    const milestonesButton = screen.getByRole('button', { name: 'Milestones' });
    const achievementsButton = screen.getByRole('button', { name: 'Achievements' });
    const allButton = screen.getByRole('button', { name: 'All' });

    // Switch to Achievements only
    fireEvent.click(achievementsButton);
    expect(screen.getByText('First Contribution Badge')).toBeDefined();
    expect(screen.queryByText('Bronze Contributor')).toBeNull();

    // Switch to Milestones only
    fireEvent.click(milestonesButton);
    expect(screen.getByText('Bronze Contributor')).toBeDefined();
    expect(screen.queryByText('First Contribution Badge')).toBeNull();

    // Switch back to All
    fireEvent.click(allButton);
    expect(screen.getByText('First Contribution Badge')).toBeDefined();
    expect(screen.getByText('Bronze Contributor')).toBeDefined();
  });

  it('has accessible toolbar and landmark lists', () => {
    render(<DeveloperJourneyTimeline activity={mockActivity} achievements={mockAchievements} />);

    expect(screen.getByRole('toolbar')).toBeDefined();
    expect(screen.getByRole('list')).toBeDefined();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });
});
