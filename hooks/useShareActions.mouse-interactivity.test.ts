import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

const mockUsername = 'testuser';
const mockExportData: DashboardExportData = {
  stats: { totalContributions: 10, currentStreak: 3, peakStreak: 5 },
  activity: [],
  languages: [],
};
const mockOnClose = vi.fn();
const url = 'https://commitpulse.app/testuser';

vi.mock('@/utils/urls', () => ({
  getDashboardUrl: () => url,
  getOrigin: () => 'https://commitpulse.app',
}));

vi.mock('html-to-image', () => ({
  toCanvas: vi.fn().mockResolvedValue({
    toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['fake'])),
  }),
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

function mockClipboard() {
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
}

function mockAnchorClick() {
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
    const el = originalCreateElement(tagName, options);
    if (tagName === 'a') {
      vi.spyOn(el, 'click').mockImplementation(() => {});
    }
    return el;
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockOnClose.mockReset();
  document.body.innerHTML = '';
  Reflect.deleteProperty(globalThis, 'ClipboardItem');
  mockClipboard();
  mockAnchorClick();
});

describe('useShareActions mouse-interactivity', () => {
  it('handleCopyLink triggers clipboard write and transitions to success', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    await act(async () => {
      await result.current.handleCopyLink();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
    expect(result.current.states['copy']).toBe('success');
  });

  it('handleTwitter opens twitter intent window', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    act(() => {
      result.current.handleTwitter();
    });
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handleLinkedIn opens linkedin share window', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    act(() => {
      result.current.handleLinkedIn();
    });
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      'noopener'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handleReddit opens reddit submit window', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    act(() => {
      result.current.handleReddit();
    });
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('reddit.com/submit'),
      '_blank',
      expect.stringContaining('noopener')
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('social share handlers call onClose after opening window', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    act(() => {
      result.current.handleTwitter();
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.handleLinkedIn();
    });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
    act(() => {
      result.current.handleReddit();
    });
    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });
});
