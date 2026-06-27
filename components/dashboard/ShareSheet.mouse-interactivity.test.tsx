import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockHandleTwitter = vi.fn();
const mockHandleLinkedIn = vi.fn();
const mockHandleReddit = vi.fn();
const mockHandleNativeShare = vi.fn();

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: () => ({
    states: {},
    handleTwitter: mockHandleTwitter,
    handleLinkedIn: mockHandleLinkedIn,
    handleReddit: mockHandleReddit,
    handleDownloadPNG: vi.fn(),
    handleDownloadWEBP: vi.fn(),
    handleDownloadSVG: vi.fn(),
    handleCopyMarkdown: vi.fn(),
    handleDownloadJSON: vi.fn(),
    handleNativeShare: mockHandleNativeShare,
  }),
}));

const mockExportData: DashboardExportData = {
  stats: { currentStreak: 5, peakStreak: 10, totalContributions: 100 },
  languages: [],
  activity: [],
};

const onClose = vi.fn();

const defaultProps = {
  username: 'octocat',
  isOpen: true,
  onClose,
  exportData: mockExportData,
};

describe('ShareSheet — Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking the backdrop overlay propagates the click event to onClose', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const overlay = container.querySelector('.fixed');
    expect(overlay).not.toBeNull();

    fireEvent.click(overlay!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking inside the modal panel stops propagation and does not call onClose', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const modal = container.querySelector('[class*="max-w-"]');
    expect(modal).not.toBeNull();

    fireEvent.click(modal!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('mouseEnter on the QR group renders hover overlay action buttons in the DOM', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const qrGroup = container.querySelector('.group');
    expect(qrGroup).not.toBeNull();

    fireEvent.mouseEnter(qrGroup!);

    expect(screen.getByText('Copy Image')).toBeTruthy();
    expect(screen.getByText('Save File')).toBeTruthy();
  });

  it('mouseleave on the QR group leaves the hover overlay in its opacity-0 hidden state', () => {
    const { container } = render(<ShareSheet {...defaultProps} />);

    const qrGroup = container.querySelector('.group');
    expect(qrGroup).not.toBeNull();

    const hoverOverlay = qrGroup!.querySelector('.opacity-0');
    expect(hoverOverlay).not.toBeNull();

    fireEvent.mouseLeave(qrGroup!);

    expect(hoverOverlay!.classList.contains('opacity-0')).toBe(true);
  });

  it('touch events on the Share on X button do not block the click handler from firing', () => {
    render(<ShareSheet {...defaultProps} />);

    const xButton = screen.getByRole('button', { name: /share on x/i });

    fireEvent.touchStart(xButton);
    fireEvent.touchEnd(xButton);
    fireEvent.click(xButton);

    expect(mockHandleTwitter).toHaveBeenCalledTimes(1);
  });
});
