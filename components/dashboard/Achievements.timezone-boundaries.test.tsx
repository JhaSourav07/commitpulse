import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import Achievements from './Achievements';
import type { Achievement } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.achievements.title': 'Achievements',
        'dashboard.achievements.see_all': 'See All Achievements',
        'dashboard.achievements.show_less': 'Show Less',
      };

      return translations[key] ?? key;
    },
  }),
}));

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Achievement 1',
    description: 'Description 1',
    icon: '🏆',
    type: 'contributions',
    isUnlocked: true,
    threshold: 10,
    currentValue: 10,
    progress: 100,
  },
  {
    id: '2',
    title: 'Achievement 2',
    description: 'Description 2',
    icon: '🔥',
    type: 'streak',
    isUnlocked: true,
    threshold: 7,
    currentValue: 7,
    progress: 100,
  },
  {
    id: '3',
    title: 'Achievement 3',
    description: 'Description 3',
    icon: '⭐',
    type: 'behavior',
    isUnlocked: false,
    threshold: 10,
    currentValue: 4,
    progress: 40,
  },
  {
    id: '4',
    title: 'Achievement 4',
    description: 'Description 4',
    icon: '🚀',
    type: 'contributions',
    isUnlocked: true,
    threshold: 25,
    currentValue: 25,
    progress: 100,
  },
  {
    id: '5',
    title: 'Achievement 5',
    description: 'Description 5',
    icon: '💎',
    type: 'streak',
    isUnlocked: false,
    threshold: 10,
    currentValue: 8,
    progress: 80,
  },
];

describe('Achievements Component', () => {
  it('renders the component title', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('displays only the first four achievements initially', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByText('Achievement 1')).toBeInTheDocument();
    expect(screen.getByText('Achievement 2')).toBeInTheDocument();
    expect(screen.getByText('Achievement 3')).toBeInTheDocument();
    expect(screen.getByText('Achievement 4')).toBeInTheDocument();
    expect(screen.queryByText('Achievement 5')).not.toBeInTheDocument();
  });

  it('shows "See All Achievements" button when there are more than four achievements', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByRole('button', { name: /see all achievements/i })).toBeInTheDocument();
  });

  it('expands to display all achievements when "See All Achievements" is clicked', () => {
    render(<Achievements achievements={mockAchievements} />);

    const seeAllButton = screen.getByRole('button', { name: /see all achievements/i });
    fireEvent.click(seeAllButton);

    expect(screen.getByText('Achievement 5')).toBeInTheDocument();
  });

  it('toggles button controls after expansion', () => {
    render(<Achievements achievements={mockAchievements} />);

    fireEvent.click(screen.getByRole('button', { name: /see all achievements/i }));

    expect(screen.queryByRole('button', { name: /see all achievements/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('collapses back to four achievements when "Show Less" is clicked', () => {
    render(<Achievements achievements={mockAchievements} />);

    const seeAllButton = screen.getByRole('button', { name: /see all achievements/i });
    fireEvent.click(seeAllButton);

    const showLessButton = screen.getByRole('button', { name: /show less/i });
    fireEvent.click(showLessButton);

    expect(screen.getByText('Achievement 1')).toBeInTheDocument();
    expect(screen.getByText('Achievement 2')).toBeInTheDocument();
    expect(screen.getByText('Achievement 3')).toBeInTheDocument();
    expect(screen.getByText('Achievement 4')).toBeInTheDocument();
    expect(screen.queryByText('Achievement 5')).not.toBeInTheDocument();
  });

  it('restores "See All Achievements" button after collapse', () => {
    render(<Achievements achievements={mockAchievements} />);

    const seeAllButton = screen.getByRole('button', { name: /see all achievements/i });
    fireEvent.click(seeAllButton);

    const showLessButton = screen.getByRole('button', { name: /show less/i });
    fireEvent.click(showLessButton);

    expect(screen.getByRole('button', { name: /see all achievements/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show less/i })).not.toBeInTheDocument();
  });

  it('does not render any achievements when array is empty', () => {
    render(<Achievements achievements={[]} />);

    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.queryByText('Achievement 1')).not.toBeInTheDocument();
  });

  it('does not show toggle button when there are four or fewer achievements', () => {
    const limitedAchievements = mockAchievements.slice(0, 4);

    render(<Achievements achievements={limitedAchievements} />);

    expect(screen.queryByRole('button', { name: /see all achievements/i })).not.toBeInTheDocument();
  });

  it('handles multiple expand-collapse cycles', () => {
    render(<Achievements achievements={mockAchievements} />);

    for (let i = 0; i < 2; i++) {
      const seeAllButton = screen.getByRole('button', { name: /see all achievements/i });
      fireEvent.click(seeAllButton);
      expect(screen.getByText('Achievement 5')).toBeInTheDocument();

      const showLessButton = screen.getByRole('button', { name: /show less/i });
      fireEvent.click(showLessButton);
      expect(screen.getByText('Achievement 4')).toBeInTheDocument();
      expect(screen.queryByText('Achievement 5')).not.toBeInTheDocument();
    }
  });

  it('renders achievement descriptions in initial view', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
    expect(screen.getByText('Description 3')).toBeInTheDocument();
    expect(screen.getByText('Description 4')).toBeInTheDocument();
  });

  it('renders achievement descriptions after expansion', () => {
    render(<Achievements achievements={mockAchievements} />);

    const seeAllButton = screen.getByRole('button', { name: /see all achievements/i });
    fireEvent.click(seeAllButton);

    expect(screen.getByText('Description 5')).toBeInTheDocument();
  });
});
