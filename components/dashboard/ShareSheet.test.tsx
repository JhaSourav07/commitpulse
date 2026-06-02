/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShareSheet from './ShareSheet';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// react-qr-code renders an <svg> that the component queries at runtime
vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => (
    <svg data-testid="qr-code" data-value={value}>
      <rect width="100" height="100" />
    </svg>
  ),
}));

// framer-motion — strip animations so tests run synchronously
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

// useShareActions — mock so every handler is a controllable spy.
// PNG and WebP use html-to-image internally which cannot run in jsdom;
// mocking the hook gives us reliable state transitions for those tests.
const mockHandlers = {
  states: {} as Record<string, 'idle' | 'loading' | 'success' | 'error'>,
  handleTwitter: vi.fn(),
  handleLinkedIn: vi.fn(),
  handleReddit: vi.fn(),
  handleDownloadPNG: vi.fn(),
  handleDownloadWEBP: vi.fn(),
  handleDownloadSVG: vi.fn(),
  handleCopyMarkdown: vi.fn(),
  handleDownloadJSON: vi.fn(),
  handleNativeShare: vi.fn(),
};

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: () => mockHandlers,
}));

// ─── Test suite ───────────────────────────────────────────────────────────────

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
      activity: [
        { date: '2026-05-01', count: 3, intensity: 2 as const },
        { date: '2026-05-02', count: 0, intensity: 0 as const },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset hook states
    mockHandlers.states = {};

    // clipboard.writeText — used by handleCopyMarkdown spy / social links
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    // execCommand — used by handleLocalCopyLink (input.select + execCommand)
    document.execCommand = vi.fn().mockReturnValue(true);

    // XMLSerializer — must be a real instantiable class, vi.fn() cannot be used as a constructor
    global.XMLSerializer = class {
      serializeToString() {
        return '<svg>mock</svg>';
      }
    } as any;

    // ClipboardItem — used by navigator.clipboard.write in QR copy-as-image
    // ClipboardItem — mock with required static method 'supports'
    global.ClipboardItem = vi.fn().mockImplementation((data: any) => data) as any;
    (global.ClipboardItem as any).supports = vi.fn().mockReturnValue(true);

    // Canvas — used by QR copy-as-image canvas path
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

    // Default social handlers: open a URL and call onClose (mirrors real hook behaviour)
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

    // Default download handlers: set states via the mock states object
    // PNG — simulates async success
    mockHandlers.handleDownloadPNG.mockImplementation(async () => {
      mockHandlers.states = { ...mockHandlers.states, png: 'loading' };
      await Promise.resolve();
      mockHandlers.states = { ...mockHandlers.states, png: 'success' };
    });

    // WebP — simulates async success
    mockHandlers.handleDownloadWEBP.mockImplementation(async () => {
      mockHandlers.states = { ...mockHandlers.states, webp: 'loading' };
      await Promise.resolve();
      mockHandlers.states = { ...mockHandlers.states, webp: 'success' };
    });

    // SVG — fetches and downloads
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
      mockHandlers.states = { ...mockHandlers.states, svg: 'success' };
    });

    // JSON — writes blob and downloads
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
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${defaultProps.username}-commitpulse.json`;
      a.click();
      URL.revokeObjectURL(url);
      mockHandlers.states = { ...mockHandlers.states, json: 'success' };
    });

    // Markdown — writes to clipboard
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

  // ─── Visibility ─────────────────────────────────────────────────────────────

  it('does not render when isOpen is false', () => {
    const { container } = render(<ShareSheet {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(<ShareSheet {...defaultProps} />);
    expect(screen.getByText('Share Profile')).toBeDefined();
    expect(screen.getByText('@octocat')).toBeDefined();
    expect(screen.getByText('Copy README Markdown')).toBeDefined();
    expect(screen.getByText('Share on X')).toBeDefined();
    expect(screen.getByText('Export Structured JSON Data')).toBeDefined();
    // CSV was removed from this component
    expect(screen.queryByText('Download CSV')).toBeNull();
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

  // ─── Close behaviour ────────────────────────────────────────────────────────

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

  // ─── Copy link (input + execCommand) ────────────────────────────────────────

  it('copies the profile link via execCommand when the copy button is clicked', async () => {
    render(<ShareSheet {...defaultProps} />);
    const input = screen.getByDisplayValue('https://commitpulse.vercel.app/dashboard/octocat');
    const copyBtn = input.closest('div')!.parentElement!.querySelector('button');
    fireEvent.click(copyBtn!);

    expect(document.execCommand).toHaveBeenCalledWith('copy');

    await waitFor(() => {
      expect(screen.getByText('✓ Link copied')).toBeDefined();
    });
  });

  // ─── Open profile in new tab ─────────────────────────────────────────────────

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

  // ─── QR code actions ─────────────────────────────────────────────────────────

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

  // ─── Social sharing ──────────────────────────────────────────────────────────

  it('handles Share on X action', () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Share on X').closest('button')!);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener'
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles LinkedIn share action', () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('LinkedIn').closest('button')!);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      'noopener'
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles Reddit share action', async () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Reddit').closest('button')!);

    await waitFor(() => expect(window.open).toHaveBeenCalled());

    const calledUrl = vi.mocked(window.open).mock.calls[0][0] as string;
    expect(calledUrl).toContain('reddit.com/submit');
    expect(calledUrl).toContain(encodeURIComponent(`/dashboard/${defaultProps.username}`));
    expect(calledUrl).toContain('title=');
    expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank', 'noopener,noreferrer');
  });

  it('handles System Share via navigator.share', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share: shareMock });

    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('System Share').closest('button')!);

    await waitFor(() => expect(shareMock).toHaveBeenCalled());
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        text: expect.any(String),
        url: expect.any(String),
      })
    );
  });

  // ─── Copy README Markdown ───────────────────────────────────────────────────

  it('handles Copy README Markdown action', async () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Copy README Markdown').closest('button')!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('![CommitPulse](')
      );
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/streak?user=octocat')
    );

    await waitFor(() => {
      expect(screen.getByText('✓ Markdown copied')).toBeDefined();
    });

    expect(screen.getByText('Copied Snippet!')).toBeDefined();
  });

  // ─── Export downloads ────────────────────────────────────────────────────────

  it('handles Download PNG Snapshot action', async () => {
    render(<ShareSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Download PNG Snapshot').closest('button')!);
    });

    expect(mockHandlers.handleDownloadPNG).toHaveBeenCalled();
  });

  it('handles Download Optimized WebP action', async () => {
    render(<ShareSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Download Optimized WebP').closest('button')!);
    });

    expect(mockHandlers.handleDownloadWEBP).toHaveBeenCalled();
  });

  it('handles Download Vector SVG Monolith action', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('<svg>mock</svg>'),
    });

    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Download Vector SVG Monolith').closest('button')!);

    await waitFor(() => expect(mockHandlers.handleDownloadSVG).toHaveBeenCalled());

    const fetchedUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
    expect(fetchedUrl).toMatch(
      new RegExp(`/api/streak\\?user=${encodeURIComponent(defaultProps.username)}$`)
    );

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toContain('image/svg+xml');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('handles Export Structured JSON Data action', async () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Export Structured JSON Data').closest('button')!);

    await waitFor(() => expect(mockHandlers.handleDownloadJSON).toHaveBeenCalled());

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
    expect(json.contributionDates).toEqual(['2026-05-01', '2026-05-02']);
    expect(json.dailyContributions).toEqual([
      { date: '2026-05-01', count: 3, intensity: 2 },
      { date: '2026-05-02', count: 0, intensity: 0 },
    ]);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('handles Download Printable 3D STL Monolith action', async () => {
    // Selectively fast-forward only the 1200ms STL delay; pass all other
    // setTimeout calls (including @testing-library/dom internals) through
    // to the real implementation so waitFor continues to work correctly.
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

  // ─── GitHub Wrapped ───────────────────────────────────────────────────────────

  it('opens GitHub Wrapped in a new tab and closes the sheet', () => {
    render(<ShareSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('GitHub Wrapped').closest('button')!);

    expect(window.open).toHaveBeenCalledWith('/dashboard/octocat/wrapped', '_blank');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // ─── Body scroll lock ─────────────────────────────────────────────────────────

  it('locks body scroll when open and restores it when closed', () => {
    const { rerender } = render(<ShareSheet {...defaultProps} isOpen={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ShareSheet {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });
});
