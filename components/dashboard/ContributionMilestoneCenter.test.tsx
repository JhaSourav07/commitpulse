/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContributionMilestoneCenter from './ContributionMilestoneCenter';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterProps(props)}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function filterProps(props: Record<string, any>) {
  const filtered: Record<string, any> = {};
  for (const key of Object.keys(props)) {
    if (
      ![
        'initial',
        'animate',
        'exit',
        'transition',
        'whileHover',
        'whileTap',
        'layout',
        'mode',
      ].includes(key)
    ) {
      filtered[key] = props[key];
    }
  }
  return filtered;
}

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'dashboard.milestones.title': 'Milestone Center',
        'dashboard.milestones.achieved': 'Achieved',
        'dashboard.milestones.inProgress': 'In Progress',
        'dashboard.milestones.nextMilestone': 'Next Milestone',
        'dashboard.milestones.complete': 'Complete',
        'dashboard.milestones.noMilestones': 'No milestones in this category',
        'dashboard.milestones.allFilter': 'All',
        'dashboard.milestones.contributions': 'Contributions',
        'dashboard.milestones.streak': 'Streak',
        'dashboard.milestones.repos': 'Repositories',
        'dashboard.milestones.stars': 'Stars',
        'dashboard.milestones.community': 'Community',
      };
      if (key === 'dashboard.milestones.description') {
        const achieved = options?.achieved ?? 0;
        const total = options?.total ?? 0;
        return `${achieved} of ${total} milestones achieved`;
      }
      return translations[key] || key;
    },
  }),
}));

const baseProps = {
  totalContributions: 1200,
  currentStreak: 15,
  peakStreak: 45,
  repositories: 30,
  stars: 75,
  followers: 60,
  activity: [
    { date: '2024-01-01', count: 5 },
    { date: '2024-01-02', count: 3 },
  ],
};

describe('ContributionMilestoneCenter', () => {
  it('renders milestone center with correct title', () => {
    render(<ContributionMilestoneCenter {...baseProps} />);
    expect(screen.getByText('Milestone Center')).toBeDefined();
  });

  it('shows achieved milestones count', () => {
    render(<ContributionMilestoneCenter {...baseProps} />);
    expect(screen.getByText('Achieved')).toBeDefined();
  });

  it('shows in progress milestones', () => {
    render(<ContributionMilestoneCenter {...baseProps} />);
    expect(screen.getByText('In Progress')).toBeDefined();
  });

  it('displays next milestone spotlight', () => {
    render(<ContributionMilestoneCenter {...baseProps} />);
    expect(screen.getByText('Next Milestone')).toBeDefined();
  });

  it('filters milestones by category when filter button is clicked', () => {
    render(<ContributionMilestoneCenter {...baseProps} />);
    const streakButton = screen.getByText('Streak');
    fireEvent.click(streakButton);
    expect(screen.getByText('Week Warrior')).toBeDefined();
    expect(screen.getByText('Monthly Machine')).toBeDefined();
  });

  it('shows completion percentage', () => {
    render(<ContributionMilestoneCenter {...baseProps} />);
    expect(screen.getByText('Complete')).toBeDefined();
  });

  it('renders empty state for category with no milestones', () => {
    render(
      <ContributionMilestoneCenter
        totalContributions={0}
        currentStreak={0}
        peakStreak={0}
        repositories={0}
        stars={0}
        followers={0}
        activity={[]}
      />
    );
    expect(screen.getByText('In Progress')).toBeDefined();
  });
});
