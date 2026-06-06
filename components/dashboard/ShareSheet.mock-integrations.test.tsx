import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShareSheet from './ShareSheet';
import { DashboardExportData } from '@/types/dashboard';

const mockHandleTwitter = vi.fn();
const mockHandleLinkedIn = vi.fn();
const mockHandleCopyMarkdown = vi.fn();
const mockHandleNativeShare = vi.fn();

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: () => ({
    states: {
      png: 'idle',
      webp: 'idle',
      svg: 'idle',
      json: 'idle',
      stl: 'idle',
    },
    handleTwitter: mockHandleTwitter,
    handleLinkedIn: mockHandleLinkedIn,
    handleReddit: vi.fn(),
    handleDownloadPNG: vi.fn(),
    handleDownloadWEBP: vi.fn(),
    handleDownloadSVG: vi.fn(),
    handleCopyMarkdown: mockHandleCopyMarkdown,
    handleDownloadJSON: vi.fn(),
    handleNativeShare: mockHandleNativeShare,
  }),
}));

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

vi.stubGlobal(
  'Image',
  class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      this.onerror?.();
    }
  }
);

const defaultProps = {
  username: 'riddhima',
  isOpen: true,
  onClose: vi.fn(),
  exportData: {} as DashboardExportData,
};

describe('ShareSheet mock integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share sheet with mocked service layer data', () => {
    render(<ShareSheet {...defaultProps} />);

    expect(screen.getByText('Social Channels')).toBeInTheDocument();
    expect(screen.getByText('Export Options')).toBeInTheDocument();
  });

  it('calls mocked X share handler', () => {
    render(<ShareSheet {...defaultProps} />);

    fireEvent.click(screen.getByText(/Share on X/i));

    expect(mockHandleTwitter).toHaveBeenCalledTimes(1);
  });

  it('calls mocked LinkedIn share handler', () => {
    render(<ShareSheet {...defaultProps} />);

    fireEvent.click(screen.getByText(/LinkedIn/i));

    expect(mockHandleLinkedIn).toHaveBeenCalledTimes(1);
  });

  it('calls mocked markdown copy handler', () => {
    render(<ShareSheet {...defaultProps} />);

    fireEvent.click(screen.getByText(/Copy README Markdown/i));

    expect(mockHandleCopyMarkdown).toHaveBeenCalledTimes(1);
  });

  it('calls mocked native share handler', () => {
    render(<ShareSheet {...defaultProps} />);

    fireEvent.click(screen.getByText(/System Share/i));

    expect(mockHandleNativeShare).toHaveBeenCalledTimes(1);
  });
});
