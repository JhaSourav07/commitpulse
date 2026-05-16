/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShareSheet from './ShareSheet';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockdata'),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, disabled, ...props }: any) => (
      <button
        className={className}
        onClick={onClick}
        disabled={disabled}
        data-testid="motion-button"
        {...props}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ShareSheet', () => {
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
      languages: [
        { name: 'TypeScript', percentage: 72, color: '#3178c6' },
        { name: 'JavaScript', percentage: 28, color: '#f1e05a' },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn().mockReturnValue('blob:mock-download'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ShareSheet {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(<ShareSheet {...defaultProps} />);
    expect(screen.getByText('Share Pulse')).toBeDefined();
    expect(screen.getByText('@octocat')).toBeDefined();
    expect(screen.getByText('Copy Link')).toBeDefined();
    expect(screen.getByText('Share on X')).toBeDefined();
    expect(screen.getByText('Download JSON')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ShareSheet {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<ShareSheet {...defaultProps} />);
    const overlay = screen.getAllByTestId('motion-div')[0];
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles Copy Link action', async () => {
    render(<ShareSheet {...defaultProps} />);
    const copyButton = screen.getByText('Copy Link').closest('button');
    fireEvent.click(copyButton!);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('octocat'));

    await waitFor(() => {
      expect(screen.getByText('Link Copied!')).toBeDefined();
    });
  });

  it('handles Share on X action', () => {
    render(<ShareSheet {...defaultProps} />);
    const twitterButton = screen.getByText('Share on X').closest('button');
    fireEvent.click(twitterButton!);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener'
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles Share on LinkedIn action', () => {
    render(<ShareSheet {...defaultProps} />);
    const linkedinButton = screen.getByText('Share on LinkedIn').closest('button');
    fireEvent.click(linkedinButton!);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      'noopener'
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles Download PNG action', async () => {
    render(<ShareSheet {...defaultProps} />);

    // Create a mock document element to satisfy the selector
    const mockRoot = document.createElement('div');
    mockRoot.id = 'dashboard-root';
    document.body.appendChild(mockRoot);

    const downloadButton = screen.getByText('Download as PNG').closest('button');
    fireEvent.click(downloadButton!);

    const { toPng } = await import('html-to-image');
    expect(toPng).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Downloaded!')).toBeDefined();
    });

    document.body.removeChild(mockRoot);
  });

  it('downloads dashboard data as formatted JSON', async () => {
    render(<ShareSheet {...defaultProps} />);

    const jsonButton = screen.getByText('Download JSON').closest('button');
    fireEvent.click(jsonButton!);

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const json = JSON.parse(await blob.text());

    expect(json).toMatchObject({
      username: 'octocat',
      currentStreak: 7,
      longestStreak: 14,
      totalContributions: 365,
      topLanguages: defaultProps.exportData.languages,
    });
    expect(json.profileUrl).toContain('/octocat');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-download');

    await waitFor(() => {
      expect(screen.getByText('JSON Downloaded!')).toBeDefined();
    });
  });
});
