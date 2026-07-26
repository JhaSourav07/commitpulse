import '@testing-library/jest-dom/vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn(() => true),
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

    // The first focusable button is the copy username button
    const copyBtn = screen.getByRole('button', {
      name: /dashboard\.profile\.copy_username_aria/i,
    });
    expect(copyBtn).toHaveFocus();
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

  describe('copy username button accessibility', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'isSecureContext', { value: true, writable: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('has aria-label reflecting uncopied state initially', () => {
      render(<ProfileCard {...mockProps} />);

      const copyBtn = screen.getByRole('button', {
        name: /dashboard\.profile\.copy_username_aria/i,
      });
      expect(copyBtn).toHaveAttribute('aria-label', 'dashboard.profile.copy_username_aria');
    });

    it('updates aria-label to copied state after clicking', async () => {
      render(<ProfileCard {...mockProps} />);

      const copyBtn = screen.getByRole('button', {
        name: /dashboard\.profile\.copy_username_aria/i,
      });

      await act(async () => {
        copyBtn.click();
      });

      expect(copyBtn).toHaveAttribute('aria-label', 'dashboard.profile.username_copied');
    });

    it('renders aria-live="polite" confirmation region after copy', async () => {
      render(<ProfileCard {...mockProps} />);

      const copyBtn = screen.getByRole('button', {
        name: /dashboard\.profile\.copy_username_aria/i,
      });

      await act(async () => {
        copyBtn.click();
      });

      const liveRegion = screen.getByText('dashboard.profile.username_copied');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('removes aria-live confirmation after timeout', async () => {
      render(<ProfileCard {...mockProps} />);

      const copyBtn = screen.getByRole('button', {
        name: /dashboard\.profile\.copy_username_aria/i,
      });

      await act(async () => {
        copyBtn.click();
      });

      expect(screen.getByText('dashboard.profile.username_copied')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // After timeout, the confirmation text should be gone and aria-label should revert
      expect(copyBtn).toHaveAttribute('aria-label', 'dashboard.profile.copy_username_aria');
    });
  });
});
