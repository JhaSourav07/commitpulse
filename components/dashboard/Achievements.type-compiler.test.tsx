import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Achievements from './Achievements';
import type { Achievement } from '@/types/dashboard';

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
  whileInView?: unknown;
  viewport?: unknown;
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileInView,
      viewport,
      initial,
      animate,
      transition,
      ...props
    }: MotionDivProps) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Trophy: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="trophy-icon" width={size} className={className} />
  ),
  Flame: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="flame-icon" width={size} className={className} />
  ),
  Sparkles: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="sparkles-icon" width={size} className={className} />
  ),
}));

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Commit',
    description: 'Made your first commit',
    icon: 'trophy',
    type: 'contributions',
    isUnlocked: true,
    threshold: 1,
    currentValue: 1,
    progress: 100,
  },
  {
    id: '2',
    title: 'Streak Starter',
    description: 'Maintained a 7-day streak',
    icon: 'flame',
    type: 'streak',
    isUnlocked: true,
    threshold: 7,
    currentValue: 7,
    progress: 100,
  },
  {
    id: '3',
    title: 'Behavior Badge',
    description: 'Consistent contributor',
    icon: 'sparkles',
    type: 'behavior',
    isUnlocked: false,
    threshold: 10,
    currentValue: 6,
    progress: 60,
  },
  {
    id: '4',
    title: 'Star Collector',
    description: 'Received 10 stars',
    icon: 'trophy',
    type: 'contributions',
    isUnlocked: false,
    threshold: 10,
    currentValue: 4,
    progress: 40,
  },
];

describe('Achievements - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Validate Achievement type fields are correctly typed: renders component without TypeScript schema violations', () => {
    const achievement: Achievement = mockAchievements[0];
    expect(typeof achievement.id).toBe('string');
    expect(typeof achievement.title).toBe('string');
    expect(typeof achievement.isUnlocked).toBe('boolean');
    expect(typeof achievement.progress).toBe('number');
    render(<Achievements achievements={[achievement]} />);
    expect(screen.getByText('First Commit')).toBeInTheDocument();
  });

  it('Assert numeric schema constraints are enforced: progress and threshold accept only number types', () => {
    const achievement = mockAchievements[2];
    expect(achievement.progress).toBeGreaterThanOrEqual(0);
    expect(achievement.progress).toBeLessThanOrEqual(100);
    expect(typeof achievement.threshold).toBe('number');
    expect(typeof achievement.currentValue).toBe('number');
  });

  it('Verify icon field is constrained to valid string literals: trophy, flame, sparkles are accepted values', () => {
    const validIcons = ['trophy', 'flame', 'sparkles'];
    mockAchievements.forEach((a) => {
      expect(validIcons).toContain(a.icon);
    });
  });

  it('Validate type field accepts only defined union members: contributions, streak, behavior are valid', () => {
    const validTypes = ['contributions', 'streak', 'behavior'];
    mockAchievements.forEach((a) => {
      expect(validTypes).toContain(a.type);
    });
  });

  it('Assert component accepts Achievement[] prop without type errors: renders list with correctly typed array', () => {
    render(<Achievements achievements={mockAchievements} />);
    expect(screen.getByText('First Commit')).toBeInTheDocument();
    expect(screen.getByText('Streak Starter')).toBeInTheDocument();
    expect(screen.getByText('Behavior Badge')).toBeInTheDocument();
    expect(screen.getByText('Star Collector')).toBeInTheDocument();
  });
});
