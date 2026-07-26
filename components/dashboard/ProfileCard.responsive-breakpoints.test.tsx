import type { ComponentProps, ReactNode } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { DashboardExportData } from '@/types/dashboard';
import ProfileCard from './ProfileCard';

// NOTE: jsdom has no CSS layout engine and cannot verify overflow, column reflow,
// or visual clipping. These tests verify that ProfileCard renders all required
// content and interactions correctly when window.matchMedia reports a 375 px
// mobile viewport — they do not and cannot assert CSS layout behaviour.

type MotionDivProps = ComponentProps<'div'> & { children?: ReactNode };
type MotionButtonProps = ComponentProps<'button'> & { children?: ReactNode };

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionDivProps) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: MotionButtonProps) => <button {...props}>{children}</button>,
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

const mockUser = {
  name: 'Test User',
  username: 'testuser',
  bio: 'Open Source Contributor',
  location: 'San Francisco',
  joinedDate: '2022',
  developerScore: 80,
  avatarUrl: 'https://example.com/avatar.png',
  isPro: false,
  stats: { repositories: 12, stars: 40, followers: 88, following: 15 },
};

const mockExportData: DashboardExportData = {
  stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
  languages: [],
};

function mockMatchMedia(viewportWidth: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => {
      const minMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      let matches = false;
      if (minMatch) matches = viewportWidth >= Number(minMatch[1]);
      else if (maxMatch) matches = viewportWidth <= Number(maxMatch[1]);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}

beforeEach(() => mockMatchMedia(375));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProfileCard — content presence under a mocked 375 px matchMedia environment', () => {
  it('renders name, username and bio when matchMedia reports a 375 px viewport', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    screen.getByText('Test User');
    screen.getByText('@testuser');
    screen.getByText('Open Source Contributor');
  });

  it('renders all four stat labels and values', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    screen.getByText('Repositories');
    screen.getByText('Stars');
    screen.getByText('Followers');
    screen.getByText('Following');
  });

  it('renders location and join-date text', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    screen.getByText('San Francisco');
    screen.getByText('2022');
  });

  it('share button opens the ShareSheet when clicked', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    fireEvent.click(screen.getByRole('button', { name: /share your pulse/i }));
    screen.getByTestId('share-sheet');
  });

  it('renders badge chips when the badges prop is provided', () => {
    render(
      <ProfileCard
        user={mockUser}
        exportData={mockExportData}
        badges={['Top Contributor', 'OSS']}
      />
    );
    screen.getByText('Top Contributor');
    screen.getByText('OSS');
  });
});
