import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Achievements from './Achievements';

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
      return (
        <div
          className={className}
          data-testid={safeProps['data-testid'] || 'motion-div'}
          {...safeProps}
        >
          {children}
        </div>
      );
    },
  },
}));

const mockAchievements = [
  {
    id: '1',
    title: 'Achiev 1',
    description: 'Desc 1',
    icon: 'award',
    type: 'streak' as const,
    isUnlocked: true,
    currentValue: 10,
    threshold: 10,
    progress: 100,
  },
  {
    id: '2',
    title: 'Achiev 2',
    description: 'Desc 2',
    icon: 'award',
    type: 'contributions' as const,
    isUnlocked: false,
    currentValue: 5,
    threshold: 10,
    progress: 50,
  },
  {
    id: '3',
    title: 'Achiev 3',
    description: 'Desc 3',
    icon: 'award',
    type: 'streak' as const,
    isUnlocked: true,
    currentValue: 5,
    threshold: 5,
    progress: 100,
  },
  {
    id: '4',
    title: 'Achiev 4',
    description: 'Desc 4',
    icon: 'award',
    type: 'contributions' as const,
    isUnlocked: false,
    currentValue: 1,
    threshold: 50,
    progress: 2,
  },
  {
    id: '5',
    title: 'Achiev 5',
    description: 'Desc 5',
    icon: 'award',
    type: 'streak' as const,
    isUnlocked: false,
    currentValue: 0,
    threshold: 100,
    progress: 0,
  },
];

describe('Achievements', () => {
  it('renders without crashing and shows the title', () => {
    render(<Achievements achievements={mockAchievements} />);
    expect(screen.getByText('Achievements')).toBeDefined();
  });

  it('applies grayscale class to locked achievements and not to unlocked ones', () => {
    render(<Achievements achievements={mockAchievements} />);
    const unlockedEl = screen.getByText('Achiev 1').parentElement;
    const lockedEl = screen.getByText('Achiev 2').parentElement;

    expect(unlockedEl?.className).not.toContain('grayscale');
    expect(unlockedEl?.className).toContain('bg-gray-100');

    expect(lockedEl?.className).toContain('grayscale');
    expect(lockedEl?.className).toContain('opacity-30');
  });

  it('only shows 4 achievements initially if there are more than 4', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByText('Achiev 1')).toBeDefined();
    expect(screen.getByText('Achiev 4')).toBeDefined();
    expect(screen.queryByText('Achiev 5')).toBeNull();
  });

  it('toggles to show all achievements when "See All Achievements" button is clicked', () => {
    render(<Achievements achievements={mockAchievements} />);

    const button = screen.getByText('See All Achievements');
    expect(button).toBeDefined();

    fireEvent.click(button);

    expect(screen.getByText('Achiev 5')).toBeDefined();
    expect(screen.getByText('Show Less')).toBeDefined();

    fireEvent.click(screen.getByText('Show Less'));

    expect(screen.queryByText('Achiev 5')).toBeNull();
    expect(screen.getByText('See All Achievements')).toBeDefined();
  });
});
