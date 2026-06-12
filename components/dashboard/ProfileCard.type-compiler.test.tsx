import type { ComponentProps, ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DashboardExportData } from '@/types/dashboard';
import ProfileCard from './ProfileCard';

type MotionDivProps = ComponentProps<'div'> & { children?: ReactNode };
type MotionButtonProps = ComponentProps<'button'> & { children?: ReactNode };

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionDivProps) => <div {...props}>{children}</div>,
    button: ({ children, onClick }: MotionButtonProps) => (
      <button onClick={onClick}>{children}</button>
    ),
  },
}));

vi.mock('./ShareSheet', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="share-sheet">Mock ShareSheet</div> : null,
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

const mockExportData: DashboardExportData = {
  stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
  languages: [],
};

const baseUser = {
  name: 'Test User',
  username: 'testuser',
  bio: 'Open Source Contributor',
  location: 'San Francisco',
  joinedDate: '2022',
  developerScore: 80,
  avatarUrl: 'https://example.com/avatar.png',
  isPro: false,
  stats: { repositories: 12, stars: 43, followers: 88, following: 15 },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProfileCard — runtime behaviour', () => {
  it('shows the PRO badge when isPro is true', () => {
    render(<ProfileCard user={{ ...baseUser, isPro: true }} exportData={mockExportData} />);
    screen.getByText('PRO');
  });

  it('does not show the PRO badge when isPro is false', () => {
    render(<ProfileCard user={baseUser} exportData={mockExportData} />);
    expect(screen.queryByText('PRO')).toBeNull();
  });

  it('renders all four stat values', () => {
    render(<ProfileCard user={baseUser} exportData={mockExportData} />);
    screen.getByText('12');
    screen.getByText('43');
    screen.getByText('88');
    screen.getByText('15');
  });

  it('renders optional badge chips when badges prop is provided', () => {
    render(
      <ProfileCard
        user={baseUser}
        exportData={mockExportData}
        badges={['GSSoC 2026', 'Top Contributor']}
      />
    );
    screen.getByText('GSSoC 2026');
    screen.getByText('Top Contributor');
  });

  it('renders no badge chips when badges prop is omitted', () => {
    render(<ProfileCard user={baseUser} exportData={mockExportData} />);
    expect(screen.queryByText('GSSoC 2026')).toBeNull();
  });
});
