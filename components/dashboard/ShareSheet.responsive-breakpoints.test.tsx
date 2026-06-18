import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareSheet from './ShareSheet';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
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
    handleNativeShare: vi.fn(),
  }),
}));

const mockExportData: DashboardExportData = {
  stats: { currentStreak: 5, peakStreak: 10, totalContributions: 100 },
  languages: [],
  activity: [],
};

const defaultProps = {
  username: 'octocat',
  isOpen: true,
  onClose: vi.fn(),
  exportData: mockExportData,
};

describe('ShareSheet — Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('modal panel has w-full and max-w-[380px] classes for fluid mobile scaling', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const modal = container.querySelector('[class*="max-w-"]');
    expect(modal).not.toBeNull();
    expect(modal!.classList.contains('w-full')).toBe(true);
  });

  it('backdrop overlay has p-4 padding class preventing content from touching screen edges', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const overlay = container.querySelector('.fixed');
    expect(overlay).not.toBeNull();
    expect(overlay!.classList.contains('p-4')).toBe(true);
  });

  it('social share buttons are wrapped in a 2-column grid layout class', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const socialGrid = container.querySelector('.grid-cols-2');
    expect(socialGrid).not.toBeNull();
    expect(socialGrid!.classList.contains('grid')).toBe(true);

    const buttonsInGrid = socialGrid!.querySelectorAll('button');
    expect(buttonsInGrid.length).toBe(5);
  });

  it('all export option buttons have w-full class ensuring vertical stacking on mobile', () => {
    render(<ShareSheet {...defaultProps} />);

    const exportButtons = [
      screen.getByRole('button', { name: /github wrapped/i }),
      screen.getByRole('button', { name: /copy readme markdown/i }),
      screen.getByRole('button', { name: /download png snapshot/i }),
      screen.getByRole('button', { name: /download optimized webp/i }),
      screen.getByRole('button', { name: /download vector svg monolith/i }),
    ];

    exportButtons.forEach((btn) => {
      expect(btn.classList.contains('w-full')).toBe(true);
    });
  });

  it('renders cleanly when matchMedia reports a 375px mobile viewport', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    render(<ShareSheet {...defaultProps} />);

    expect(screen.getByRole('button', { name: /close share panel/i })).toBeTruthy();
    expect(screen.getByTestId('qr-code')).toBeTruthy();
  });
});
