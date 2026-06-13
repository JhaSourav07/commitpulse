import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileCard from './ProfileCard';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}));

vi.mock('./ShareSheet', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div role="dialog" aria-label="Share profile dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.profile.pro': 'PRO',
        'dashboard.profile.score': 'Developer Score',
        'dashboard.profile.repos': 'Repos',
        'dashboard.profile.stars': 'Stars',
        'dashboard.profile.followers': 'Followers',
        'dashboard.profile.following': 'Following',
        'dashboard.profile.share': 'Share Profile',
      };

      return translations[key] || key;
    },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, className, ...props }: any) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition'].includes(key)) {
            acc[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      return (
        <div className={className} {...validProps}>
          {children}
        </div>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    button: ({ children, className, onClick, ...props }: any) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['whileHover', 'whileTap'].includes(key)) {
            acc[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      return (
        <button className={className} onClick={onClick} {...validProps}>
          {children}
        </button>
      );
    },
  },
}));

describe('ProfileCard Accessibility Standards & Screen Reader Aria Compliance', () => {
  const mockUser = {
    avatarUrl: 'https://github.com/octocat.png',
    name: 'Octo Cat',
    username: 'octocat',
    bio: 'Open source contributor',
    location: 'San Francisco',
    joinedDate: 'Joined Jan 2020',
    isPro: true,
    developerScore: 82,
    stats: {
      repositories: 42,
      stars: 120,
      followers: 900,
      following: 80,
    },
  };

  const mockExportData = {} as React.ComponentProps<typeof ProfileCard>['exportData'];

  it('inspects markup for accessible image labels and profile identity text', () => {
    render(
      <ProfileCard user={mockUser} exportData={mockExportData} badges={['Top Contributor']} />
    );

    expect(screen.getByRole('img', { name: /octo cat/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /octo cat/i })).toBeInTheDocument();
    expect(screen.getByText('@octocat')).toBeInTheDocument();
    expect(screen.getByText('Open source contributor')).toBeInTheDocument();
  });

  it('asserts interactive share button can receive keyboard focus', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    const shareButton = screen.getByRole('button', { name: /share profile/i });
    shareButton.focus();

    expect(shareButton).toHaveFocus();
  });

  it('verifies tooltip-like and descriptive profile metadata is announced as visible text', () => {
    render(
      <ProfileCard user={mockUser} exportData={mockExportData} badges={['Top Contributor']} />
    );

    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('Joined Jan 2020')).toBeInTheDocument();
    expect(screen.getByText('Top Contributor')).toBeInTheDocument();
    expect(screen.getByText('Developer Score')).toBeInTheDocument();
  });

  it('tests keyboard control path and opens share dialog through normal tab order', async () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    const user = userEvent.setup();

    await user.tab();
    const shareButton = screen.getByRole('button', { name: /share profile/i });

    expect(shareButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /share profile dialog/i })).toBeInTheDocument();
  });

  it('confirms stats and heading hierarchy remain logically available to screen readers', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    expect(screen.getByRole('heading', { level: 2, name: /octo cat/i })).toBeInTheDocument();

    expect(screen.getByText('Repos')).toBeInTheDocument();
    expect(screen.getByText('Stars')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });
});
