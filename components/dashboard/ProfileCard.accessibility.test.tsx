import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import ProfileCard from './ProfileCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    button: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      children: React.ReactNode;
    }) => <button {...props}>{children}</button>,
  },
}));

vi.mock('./ShareSheet', () => ({
  default: () => <div data-testid="share-sheet" />,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockProps = {
  user: {
    avatarUrl: 'https://example.com/avatar.png',
    isPro: true,
    name: 'Sanz',
    username: 'sanzzzz-g',
    bio: 'Frontend developer',
    location: 'India',
    joinedDate: 'January 2024',
    developerScore: 95,
    stats: {
      repositories: 120,
      stars: 450,
      followers: 300,
      following: 180,
    },
  },
  exportData: {} as never,
  badges: ['PRO', 'TOP CONTRIBUTOR'],
};

describe('ProfileCard Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('renders logical heading hierarchy correctly', () => {
    render(<ProfileCard {...mockProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Sanz')).toBeInTheDocument();
  });

  it('renders accessible profile image with alt text', () => {
    render(<ProfileCard {...mockProps} />);

    const image = screen.getByRole('img');

    expect(image).toHaveAttribute('alt', 'Sanz');
  });

  it('supports keyboard tab navigation for interactive controls', async () => {
    const user = userEvent.setup();

    render(<ProfileCard {...mockProps} />);

    await user.tab();

    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('renders visible accessible text and badge labels', () => {
    render(<ProfileCard {...mockProps} />);

    expect(screen.getByText(/frontend developer/i)).toBeInTheDocument();
    expect(screen.getByText(/top contributor/i)).toBeInTheDocument();
  });

  it('renders accessible share action button with readable text', () => {
    render(<ProfileCard {...mockProps} />);

    expect(
      screen.getByRole('button', {
        name: /dashboard.profile.share/i,
      })
    ).toBeInTheDocument();
  });
});
