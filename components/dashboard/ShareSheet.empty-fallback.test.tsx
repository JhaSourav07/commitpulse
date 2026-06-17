import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareSheet from './ShareSheet';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...props}>{children as React.ReactNode}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-qr-code', () => ({
  default: () => <svg data-testid="qr-code" />,
}));

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

const emptyExportData: DashboardExportData = {
  stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
  languages: [],
  activity: [],
};

const nullExportData = null as unknown as DashboardExportData;

describe('ShareSheet Edge Cases & Empty/Missing Inputs Verification', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when exportData contains empty arrays', () => {
    expect(() =>
      render(
        <ShareSheet
          username="testuser"
          isOpen={true}
          onClose={onClose}
          exportData={emptyExportData}
        />
      )
    ).not.toThrow();
  });

  it('renders without crashing when exportData is null (simulated)', () => {
    expect(() =>
      render(
        <ShareSheet
          username="testuser"
          isOpen={true}
          onClose={onClose}
          exportData={nullExportData}
        />
      )
    ).not.toThrow();
  });

  it('displays the ShareSheet main container maintaining standard styles even with empty data', () => {
    render(
      <ShareSheet
        username="testuser"
        isOpen={true}
        onClose={onClose}
        exportData={emptyExportData}
      />
    );

    const container = screen.getByText('testuser').closest('.relative');
    expect(container).toHaveClass('w-full', 'max-w-[380px]', 'flex', 'flex-col', 'rounded-3xl');
  });

  it('verifies that no hydration failures occur with empty initial data by ensuring key text exists', () => {
    render(
      <ShareSheet
        username="testuser"
        isOpen={true}
        onClose={onClose}
        exportData={emptyExportData}
      />
    );

    expect(screen.getByText('Social Channels')).toBeInTheDocument();
    expect(screen.getByText('Export Options')).toBeInTheDocument();
  });

  it('checks key DOM structures to make sure core markers exist even without populated data', () => {
    render(
      <ShareSheet
        username="testuser"
        isOpen={true}
        onClose={onClose}
        exportData={emptyExportData}
      />
    );

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(
      'https://commitpulse.vercel.app/dashboard/testuser'
    );
  });
});
