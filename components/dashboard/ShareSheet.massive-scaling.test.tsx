import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ShareSheet from './ShareSheet';
import React, { type ReactNode } from 'react';

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: () => ({
    states: {},
    handleTwitter: vi.fn(),
    handleLinkedIn: vi.fn(),
    handleReddit: vi.fn(),
    handleDownloadPNG: vi.fn(),
    handleDownloadWEBP: vi.fn(),
    handleDownloadSVG: vi.fn(),
    handleCopyMarkdown: vi.fn(),
    handleDownloadJSON: vi.fn(),
    handleDownloadSTL: vi.fn(),
    handleNativeShare: vi.fn(),
  }),
}));

vi.mock('react-qr-code', () => ({
  default: () => <svg data-testid="qr-code" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const defaultProps = {
  username: 'octocat',
  isOpen: true,
  onClose: vi.fn(),
  exportData: {
    stats: {
      currentStreak: 7,
      peakStreak: 14,
      totalContributions: 365,
    },
    languages: [],
    activity: [],
  },
};

describe('ShareSheet - Massive Data Sets & Extreme Scaling', () => {
  it('renders successfully with extremely long usernames', () => {
    const hugeUsername = 'user'.repeat(5000);

    expect(() => render(<ShareSheet {...defaultProps} username={hugeUsername} />)).not.toThrow();
  });

  it('renders successfully with extremely large activity datasets', () => {
    const hugeActivity = Array.from({ length: 10000 }, (_, i) => ({
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      count: i,
      intensity: 0 as const,
    }));

    render(
      <ShareSheet
        {...defaultProps}
        exportData={{
          ...defaultProps.exportData,
          activity: hugeActivity,
        }}
      />
    );

    expect(screen.getByText(/Share on X/i)).toBeInTheDocument();
  });

  it('renders successfully with extremely large language datasets', () => {
    const hugeLanguages = Array.from({ length: 5000 }, (_, i) => ({
      name: `Language-${i}`,
      percentage: 1,
      color: '#000000',
    }));

    render(
      <ShareSheet
        {...defaultProps}
        exportData={{
          ...defaultProps.exportData,
          languages: hugeLanguages,
        }}
      />
    );

    expect(screen.getByText(/LinkedIn/i)).toBeInTheDocument();
  });

  it('handles extreme contribution statistics without crashing', () => {
    render(
      <ShareSheet
        {...defaultProps}
        exportData={{
          ...defaultProps.exportData,
          stats: {
            currentStreak: Number.MAX_SAFE_INTEGER,
            peakStreak: Number.MAX_SAFE_INTEGER,
            totalContributions: Number.MAX_SAFE_INTEGER,
          },
        }}
      />
    );

    expect(screen.getByText(/Export Options/i)).toBeInTheDocument();
  });

  it('maintains core share actions under extreme payload sizes', () => {
    const hugeUsername = 'a'.repeat(10000);

    render(<ShareSheet {...defaultProps} username={hugeUsername} />);

    expect(screen.getByText(/Share on X/i)).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByText(/Reddit/i)).toBeInTheDocument();
  });
});
