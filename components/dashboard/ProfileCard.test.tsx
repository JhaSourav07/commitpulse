import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import ProfileCard from './ProfileCard';

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
};

type MotionButtonProps = ComponentProps<'button'> & {
  children?: ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: MotionDivProps) => <div>{children}</div>,
    button: ({ children, onClick }: MotionButtonProps) => (
      <button onClick={onClick}>{children}</button>
    ),
  },
}));

vi.mock('./ShareSheet', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Mock ShareSheet</div> : null),
}));

vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn(() => true),
}));

const mockUser = {
  name: 'Mayank Rawat',
  username: 'mayank200529',
  bio: 'Open Source Contributor',
  location: 'Jaipur',
  joinedDate: '2024',
  developerScore: 95,
  avatarUrl: 'https://example.com/avatar.png',
  isPro: false,
  stats: {
    repositories: 10,
    stars: 50,
    followers: 100,
    following: 20,
  },
};

const mockExportData = {
  username: 'mayank200529',
} as never;

describe('ProfileCard', () => {
  it('renders user name', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Mayank Rawat')).toBeTruthy();
  });

  it('renders username with @ prefix', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('@mayank200529')).toBeTruthy();
  });

  it('renders bio', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Open Source Contributor')).toBeTruthy();
  });

  it('renders location', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Jaipur')).toBeTruthy();
  });

  it('renders developer score', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('95')).toBeTruthy();
  });

  it('renders Share Your Pulse button', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);
    expect(screen.getByText('Share Your Pulse')).toBeTruthy();
  });

  it('shows ShareSheet when share button is clicked', () => {
    render(<ProfileCard user={mockUser} exportData={mockExportData} />);

    fireEvent.click(screen.getByText('Share Your Pulse'));

    expect(screen.getByText('Mock ShareSheet')).toBeTruthy();
  });

  describe('copy username button', () => {
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

    it('renders a copy username button beside the username', () => {
      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      expect(screen.getByRole('button', { name: /copy username to clipboard/i })).toBeTruthy();
    });

    it('calls navigator.clipboard.writeText with the exact username on click', async () => {
      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      const copyBtn = screen.getByRole('button', { name: /copy username to clipboard/i });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mayank200529');
    });

    it('shows "Username copied!" confirmation after clicking', async () => {
      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      const copyBtn = screen.getByRole('button', { name: /copy username to clipboard/i });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(screen.getByText('Username copied!')).toBeTruthy();
    });

    it('reverts confirmation text after ~2s timeout', async () => {
      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      const copyBtn = screen.getByRole('button', { name: /copy username to clipboard/i });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(screen.getByText('Username copied!')).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('Username copied!')).toBeNull();
    });

    it('uses fallbackCopyToClipboard when navigator.clipboard is unavailable', async () => {
      Object.assign(navigator, { clipboard: undefined });
      Object.defineProperty(window, 'isSecureContext', { value: false, writable: true });

      const { fallbackCopyToClipboard } = await import('@/utils/clipboard');

      render(<ProfileCard user={mockUser} exportData={mockExportData} />);
      const copyBtn = screen.getByRole('button', { name: /copy username to clipboard/i });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(fallbackCopyToClipboard).toHaveBeenCalledWith('mayank200529');
    });
  });
});
