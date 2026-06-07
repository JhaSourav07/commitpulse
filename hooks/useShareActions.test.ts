import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockPng'),
  toCanvas: vi.fn().mockResolvedValue({
    toBlob: (cb: (blob: Blob) => void) => {
      cb(new Blob(['test'], { type: 'image/png' }));
    },
    toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,mockWebp'),
  }),
}));

describe('useShareActions', () => {
  const mockUsername = 'atharv96k';
  const mockClose = vi.fn();

  const mockExportData: DashboardExportData = {
    stats: {
      currentStreak: 5,
      peakStreak: 12,
      totalContributions: 142,
    },
    languages: [
      { name: 'Java', color: '#b07219', percentage: 70 },
      { name: 'TypeScript', color: '#3178c6', percentage: 30 },
    ],
  };

  const originalCreateElement = document.createElement.bind(document);
  let mockLinkElement: HTMLAnchorElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    global.fetch = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    vi.spyOn(window, 'open').mockImplementation(() => null);

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    mockLinkElement = originalCreateElement('a') as HTMLAnchorElement;
    vi.spyOn(mockLinkElement, 'click').mockImplementation(() => undefined);

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLinkElement;
      }
      return originalCreateElement(tagName);
    });

    document.body.innerHTML = '<div id="dashboard-root">Dashboard</div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    Reflect.deleteProperty(globalThis, 'fetch');
    Reflect.deleteProperty(globalThis, 'ClipboardItem');
  });

  it('handleCopyLink calls navigator.clipboard.writeText with a profile URL containing the username', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    let success;
    await act(async () => {
      success = await result.current.handleCopyLink();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/dashboard/${mockUsername}`)
    );
    expect(success).toBe(true);
    expect(result.current.states['copy']).toBe('success');
  });

  it('resets copy state to idle after 2500ms', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    await act(async () => {
      await result.current.handleCopyLink();
    });

    expect(result.current.states['copy']).toBe('success');

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.states['copy']).toBe('idle');
  });

  it('copies dashboard image to clipboard successfully', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    class MockClipboardItem {
      constructor(public data: Record<string, Blob>) {}
    }

    Object.defineProperty(globalThis, 'ClipboardItem', {
      value: MockClipboardItem,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        write: writeMock,
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    await act(async () => {
      await result.current.handleCopyImage();
    });

    expect(writeMock).toHaveBeenCalled();
    expect(result.current.states['copyImage']).toBe('success');
  });

  it('handleTwitter opens window to share on twitter/x', () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    act(() => {
      result.current.handleTwitter();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener'
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it('handleLinkedIn opens window to share on linkedin', () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    act(() => {
      result.current.handleLinkedIn();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      'noopener'
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it('handleReddit opens window to submit link on reddit', () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    act(() => {
      result.current.handleReddit();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('reddit.com/submit'),
      '_blank',
      'noopener,noreferrer'
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it('handleCopyMarkdown writes an interactive markdown string to clipboard', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    await act(async () => {
      await result.current.handleCopyMarkdown();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/api/streak?user=${mockUsername}`)
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringMatching(/^!\[CommitPulse\]\(https?:\/\/[^)]+\/api\/streak\?user=atharv96k\)$/)
    );
  });

  it('handleDownloadSVG sanitizes unsafe attributes before creating the download blob', async () => {
    const maliciousSvg =
      '<svg><script>alert(1)</script><rect width="10" height="10" onload="evil()" /><a href="javascript:alert(1)"><text>x</text></a></svg>';

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(maliciousSvg),
    } as unknown as Response);

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    await act(async () => {
      await result.current.handleDownloadSVG();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/streak\?user=atharv96k$/)
    );
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);

    const blob = vi.mocked(global.URL.createObjectURL).mock.calls[0][0] as Blob;
    const sanitizedSvg = await blob.text();

    expect(sanitizedSvg).toContain('<svg');
    expect(sanitizedSvg).not.toContain('<script');
    expect(sanitizedSvg).not.toContain('onload=');
    expect(sanitizedSvg).not.toContain('javascript:');
    expect(result.current.states['svg']).toBe('success');
  });

  it('handleDownloadJSON bundles and formats a structured JSON data blob download', () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    act(() => {
      result.current.handleDownloadJSON();
    });

    expect(mockLinkElement.download).toContain(`commitpulse-${mockUsername}-stats.json`);
    expect(mockLinkElement.href).toBe('blob:mock-url');
    expect(mockLinkElement.click).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
