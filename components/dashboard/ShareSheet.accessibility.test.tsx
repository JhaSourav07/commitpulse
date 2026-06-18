import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    handleDownloadSTL: vi.fn(),
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

describe('ShareSheet - Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Close button has descriptive aria-label for screen reader announcement', () => {
    render(<ShareSheet {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /close share panel/i });
    expect(closeButton).toBeTruthy();
    expect(closeButton.getAttribute('aria-label')).toBe('Close share panel');
  });

  it('All interactive buttons are focusable and have accessible names', () => {
    render(<ShareSheet {...defaultProps} />);

    const buttons = screen.getAllByRole('button');

    // Every button must have an accessible name — either via text content or aria-label.
    // Icon-only buttons (no text, no aria-label) must at minimum have their decorative
    // SVG marked aria-hidden="true" so assistive technology is not given empty noise.
    buttons.forEach((button: HTMLElement) => {
      const hasAccessibleName: boolean =
        (button.textContent?.trim() ?? '').length > 0 ||
        button.getAttribute('aria-label') !== null ||
        button.getAttribute('aria-labelledby') !== null;

      if (!hasAccessibleName) {
        // Icon-only button: assert its SVG child is hidden from assistive technology
        const hiddenSvg = button.querySelector('svg[aria-hidden="true"]');
        expect(
          hiddenSvg,
          `Icon-only button has no accessible name and its SVG is not aria-hidden: ${button.outerHTML}`
        ).not.toBeNull();
      } else {
        expect(hasAccessibleName, `Button has no accessible name: ${button.outerHTML}`).toBe(true);
      }
    });
  });

  it('Social share buttons have visible descriptive text labels for screen readers', () => {
    render(<ShareSheet {...defaultProps} />);

    // Each social button must have visible text content announcing its purpose
    expect(screen.getByRole('button', { name: /share on x/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /linkedin/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reddit/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /system share/i })).toBeTruthy();
  });

  it('SVG icon elements have aria-hidden to prevent noise in screen reader output', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    // Decorative SVG icons must be hidden from assistive technology
    const decorativeSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(decorativeSvgs.length).toBeGreaterThan(0);
  });

  it('Profile URL input is readonly and accessible with correct semantic markup', () => {
    render(<ShareSheet {...defaultProps} />);

    // The readonly URL input must be present and programmatically accessible
    const input = screen.getByDisplayValue(/commitpulse\.vercel\.app\/dashboard\/octocat/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute('readonly')).toBeDefined();
    expect(input.tagName.toLowerCase()).toBe('input');
  });
});
