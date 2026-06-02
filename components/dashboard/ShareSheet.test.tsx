/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShareSheet from './ShareSheet';

// ---------------------------------------------------------------------------
// Unified Mock Configuration & Spies
// ---------------------------------------------------------------------------
const mockHandleTwitter = vi.fn();
const mockHandleLinkedIn = vi.fn();
const mockHandleReddit = vi.fn();
const mockHandleDownloadPNG = vi.fn();
const mockHandleDownloadWEBP = vi.fn();
const mockHandleDownloadSVG = vi.fn();
const mockHandleDownloadJSON = vi.fn();
const mockHandleCopyMarkdown = vi.fn();
const mockHandleNativeShare = vi.fn();
let mockStates: Record<string, 'idle' | 'loading' | 'success' | 'error'> = {};

// Unified dynamic object to satisfy both old mockHandlers and new isolated assertions
const mockHandlers = {
  get states() {
    return mockStates;
  },
  set states(val) {
    mockStates = val;
  },
  handleTwitter: mockHandleTwitter,
  handleLinkedIn: mockHandleLinkedIn,
  handleReddit: mockHandleReddit,
  handleDownloadPNG: mockHandleDownloadPNG,
  handleDownloadWEBP: mockHandleDownloadWEBP,
  handleDownloadSVG: mockHandleDownloadSVG,
  handleDownloadJSON: mockHandleDownloadJSON,
  handleCopyMarkdown: mockHandleCopyMarkdown,
  handleNativeShare: mockHandleNativeShare,
};

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: () => mockHandlers,
}));

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockdata'),
}));

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => (
    <svg data-testid="qr-code" data-value={value}>
      <rect width="100" height="100" />
    </svg>
  ),
}));

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

// ---------------------------------------------------------------------------
// Shared Setup Props
// ---------------------------------------------------------------------------
const defaultProps = {
  username: 'octocat',
  isOpen: true,
  onClose: vi.fn(),
  exportData: {
    stats: { currentStreak: 7, peakStreak: 14, totalContributions: 365 },
    languages: [
      { name: 'TypeScript', percentage: 72, color: '#3178c6' },
      { name: 'JavaScript', percentage: 28, color: '#f1e05a' },
    ],
    activity: [
      { date: '2026-05-01', count: 3, intensity: 2 as const },
      { date: '2026-05-02', count: 0, intensity: 0 as const },
    ],
  },
};

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------
describe('ShareSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStates = {};

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    document.execCommand = vi.fn().mockReturnValue(true);

    global.XMLSerializer = class {
      serializeToString() {
        return '<svg>mock</svg>';
      }
    } as any;

    global.ClipboardItem = vi.fn().mockImplementation((data: any) => data) as any;
    (global.ClipboardItem as any).supports = vi.fn().mockReturnValue(true);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    });
    HTMLCanvasElement.prototype.toBlob = vi
      .fn()
      .mockImplementation((cb: (b: Blob) => void) => cb(new Blob([''], { type: 'image/png' })));

    vi.spyOn(window, 'open').mockImplementation(() => null);

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn().mockReturnValue('blob:mock-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    // Hook Behavior Multi-stubs mapping
    mockHandlers.handleTwitter.mockImplementation(() => {
      window.open('https://twitter.com/intent/tweet?text=test', '_blank', 'noopener');
      defaultProps.onClose();
    });
    mockHandlers.handleLinkedIn.mockImplementation(() => {
      window.open('https://linkedin.com/sharing/share-offsite?url=test', '_blank', 'noopener');
      defaultProps.onClose();
    });
    mockHandlers.handleReddit.mockImplementation(() => {
      window.open(
        `https://reddit.com/submit?url=%2Fdashboard%2F${defaultProps.username}&title=test`,
        '_blank',
        'noopener,noreferrer'
      );
      defaultProps.onClose();
    });
    mockHandlers.handleNativeShare.mockImplementation(async () => {
      if (navigator.share) {
        await navigator.share({ title: 'test', text: 'test', url: 'test' });
      }
    });

    mockHandlers.handleDownloadPNG.mockImplementation(async () => {
      mockStates = { ...mockStates, png: 'loading' };
      await Promise.resolve();
      mockStates = { ...mockStates, png: 'success' };
    });

    mockHandlers.handleDownloadWEBP.mockImplementation(async () => {
      mockStates = { ...mockStates, webp: 'loading' };
      await Promise.resolve();
      mockStates = { ...mockStates, webp: 'success' };
    });

    mockHandlers.handleDownloadSVG.mockImplementation(async () => {
      const res = await fetch(`/api/streak?user=${defaultProps.username}`);
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${defaultProps.username}-monolith.svg`;
      a.click();
      URL.revokeObjectURL(url);
      mockStates = { ...mockStates, svg: 'success' };
    });

    mockHandlers.handleDownloadJSON.mockImplementation(() => {
      const { stats, languages, activity } = defaultProps.exportData;
      const payload = {
        username: defaultProps.username,
        currentStreak: stats.currentStreak,
        longestStreak: stats.peakStreak,
        totalContributions: stats.totalContributions,
        topLanguages: languages,
        profileUrl: `https://commitpulse.vercel.app/dashboard/${defaultProps.username}`,
        contributionDates: activity.map((a) => a.date),
        dailyContributions: activity.map((a) => ({
          date: a.date,
          count: a.count,
          intensity: a.intensity,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${defaultProps.username}-commitpulse.json`;
      a.click();
      URL.revokeObjectURL(url);
      mockStates = { ...mockStates, json: 'success' };
    });

    mockHandlers.handleCopyMarkdown.mockImplementation(async () => {
      await navigator.clipboard.writeText(
        `![CommitPulse](https://commitpulse.vercel.app/api/streak?user=${defaultProps.username})`
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('dark');
  });

  // ── Visibility -------------------------------------------------------------
  it('does not render when isOpen is false', () => {
    const { container } = render(<ShareSheet {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(<ShareSheet {...defaultProps} />);
    expect(screen.getByText('octocat')).toBeDefined();
    expect(screen.getByText('Share on X')).toBeDefined();
    expect(screen.getByText('LinkedIn')).toBeDefined();
    expect(screen.getByText('Reddit')).toBeDefined();
    expect(screen.getByText('System Share')).toBeDefined();
    expect(screen.getByText('Download PNG Snapshot')).toBeDefined();
    expect(screen.getByText('Export Structured JSON Data')).toBeDefined();
    expect(screen.getByText('Download Vector SVG Monolith')).toBeDefined();
    expect(screen.getByText('Copy README Markdown')).toBeDefined();
  });

  it('renders the QR code with the correct profile URL', () => {
    render(<ShareSheet {...defaultProps} />);
    const qr = screen.getByTestId('qr-code');
    expect(qr.getAttribute('data-value')).toBe('https://commitpulse.vercel.app/dashboard/octocat');
  });

  it('renders the profile URL in the readonly input', () => {
    render(<ShareSheet {...defaultProps} />);
    const input = screen.getByDisplayValue('https://commitpulse.vercel.app/dashboard/octocat');
    expect(input).toBeDefined();
  });

  // ── Close behaviour --------------------------------------------------------
  it('renders close button with correct aria-label and calls onClose', () => {
    render(<ShareSheet {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close share panel');
    expect(closeButton).toBeDefined();
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ShareSheet {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop overlay is clicked', () => {
    render(<ShareSheet {...defaultProps} />);
    const overlay = screen.getAllByTestId('motion-div')[0];
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // ── Copy Link --------------------------------------------------------------
  it('handles Copy Link action', async () => {
    render(<ShareSheet {...defaultProps} />);
    const input = screen.getByDisplayValue('https://commitpulse.vercel.app/dashboard/octocat');
    const copyIconButton = input
      .closest('div')!
      .parentElement!.querySelector('button:not([aria-label])') as HTMLButtonElement;

    document.execCommand = vi.fn().mockReturnValue(true);
    fireEvent.click(copyIconButton!);

    await waitFor(() => {
      expect(screen.getByText('✓ Link copied')).toBeDefined();
    });
  });

  // ── Copy Markdown ----------------------------------------------------------
  it('handles Copy Markdown action', async () => {
    render(<ShareSheet {...defaultProps} />);
    const copyButton = screen.getByText('Copy README Markdown').closest('button');
    fireEvent.click(copyButton!);
    expect(mockHandleCopyMarkdown).toHaveBeenCalled();
  });

  // ── Open profile in new tab ------------------------------------------------
  it('opens the profile URL in a new tab when the external-link button is clicked', () => {
    render(<ShareSheet {...defaultProps} />);
    const input = screen.getByDisplayValue('https://commitpulse.vercel.app/dashboard/octocat');
    const buttons = input.closest('div')!.parentElement!.querySelectorAll('button');
    fireEvent.click(buttons[1]);
    expect(window.open).toHaveBeenCalledWith(
      'https://commitpulse.vercel.app/dashboard/octocat',
      '_blank'
    );
  });

  // ── QR code actions --------------------------------------------------------
  it('downloads the QR code as SVG when Save File is clicked', async () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Save File'));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    await waitFor(() => {
      expect(screen.getByText('✓ QR Saved')).toBeDefined();
    });
  });

  // ── Social shares ----------------------------------------------------------
  it('handles Share on X action', () => {
    render(<ShareSheet {...defaultProps} />);
    const twitterButton = screen.getByText('Share on X').closest('button');
    fireEvent.click(twitterButton!);
    expect(mockHandleTwitter).toHaveBeenCalled();
  });

  it('handles LinkedIn share action', () => {
    render(<ShareSheet {...defaultProps} />);
    const linkedinButton = screen.getByText('LinkedIn').closest('button');
    fireEvent.click(linkedinButton!);
    expect(mockHandleLinkedIn).toHaveBeenCalled();
  });

  it('handles Share via OS Sheet action', async () => {
    render(<ShareSheet {...defaultProps} />);
    const shareButton = screen.getByText('System Share').closest('button');
    fireEvent.click(shareButton!);
    expect(mockHandleNativeShare).toHaveBeenCalled();
  });

  it('handles Reddit share action', () => {
    render(<ShareSheet {...defaultProps} />);
    const redditButton = screen.getByText('Reddit').closest('button');
    fireEvent.click(redditButton!);
    expect(mockHandleReddit).toHaveBeenCalled();
  });

  // ── Downloads --------------------------------------------------------------
  it('handles Download PNG action', () => {
    render(<ShareSheet {...defaultProps} />);
    const downloadButton = screen.getByText('Download PNG Snapshot').closest('button');
    fireEvent.click(downloadButton!);
    expect(mockHandleDownloadPNG).toHaveBeenCalled();
  });

  it('shows "Saved Asset!" label when PNG download succeeds', () => {
    mockStates['png'] = 'success';
    render(<ShareSheet {...defaultProps} />);
    expect(screen.getAllByText('Saved Asset!').length).toBeGreaterThan(0);
    mockStates['png'] = 'idle';
  });

  it('handles Download JSON action', () => {
    render(<ShareSheet {...defaultProps} />);
    const jsonButton = screen.getByText('Export Structured JSON Data').closest('button');
    fireEvent.click(jsonButton!);
    expect(mockHandleDownloadJSON).toHaveBeenCalled();
  });

  it('handles Download SVG action', () => {
    render(<ShareSheet {...defaultProps} />);
    const svgButton = screen.getByText('Download Vector SVG Monolith').closest('button');
    fireEvent.click(svgButton!);
    expect(mockHandleDownloadSVG).toHaveBeenCalled();
  });

  it('handles Download Printable 3D STL Monolith action', async () => {
    const realSetTimeout = globalThis.setTimeout.bind(globalThis);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(
      (fn: any, delay?: any, ...args: any[]) => {
        if (delay === 1200) {
          fn(...args);
          return 0 as any;
        }
        return realSetTimeout(fn, delay, ...args);
      }
    );

    render(<ShareSheet {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Download Printable 3D STL Monolith').closest('button')!);
    });

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    await waitFor(() => {
      expect(screen.getByText('Saved Asset!')).toBeDefined();
    });
  });

  // ── GitHub Wrapped ---------------------------------------------------------
  it('opens GitHub Wrapped in a new tab and closes the sheet', () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('GitHub Wrapped').closest('button')!);
    expect(window.open).toHaveBeenCalledWith('/dashboard/octocat/wrapped', '_blank');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // ── Body scroll lock -------------------------------------------------------
  it('locks body scroll when open and restores it when closed', () => {
    const { rerender } = render(<ShareSheet {...defaultProps} isOpen={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ShareSheet {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });
});
