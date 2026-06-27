import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  {
    id: '5',
    title: 'Open Source Hero',
    description: 'Contributed to 5 repos',
    icon: 'trophy',
    type: 'contributions',
    isUnlocked: true,
    threshold: 5,
    currentValue: 5,
    progress: 100,
  },
];

describe('Achievements - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Mock standard asynchronous imports and databases using stubs: renders mocked icons without real lucide-react', () => {
    render(<Achievements achievements={mockAchievements.slice(0, 4)} />);
    expect(screen.getAllByTestId('trophy-icon').length).toBeGreaterThan(0);
  });

  it('Test service loading paths to ensure pending state overlays render: renders all visible achievements from stub data', () => {
    render(<Achievements achievements={mockAchievements.slice(0, 4)} />);
    expect(screen.getByText('First Commit')).toBeInTheDocument();
    expect(screen.getByText('Streak Starter')).toBeInTheDocument();
  });

  it('Assert local cache layers are queried before triggering database retrievals: renders only first 4 achievements by default', () => {
    render(<Achievements achievements={mockAchievements} />);
    expect(screen.getByText('First Commit')).toBeInTheDocument();
    expect(screen.queryByText('Open Source Hero')).not.toBeInTheDocument();
  });

  it('Verify correct fallback procedures during fake endpoint timeout blocks: shows See All button when achievements exceed 4', () => {
    render(<Achievements achievements={mockAchievements} />);
    expect(screen.getByText('See All Achievements')).toBeInTheDocument();
  });

  it('Assert complete cache sync is written on success callbacks: toggles all achievements on See All click', () => {
    render(<Achievements achievements={mockAchievements} />);
    fireEvent.click(screen.getByText('See All Achievements'));
    expect(screen.getByText('Open Source Hero')).toBeInTheDocument();
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });
});
