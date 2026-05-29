import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('html-to-image', () => ({
  toCanvas: vi.fn().mockResolvedValue({
    toBlob: (cb: (blob: Blob) => void) => {
      cb(new Blob(['test'], { type: 'image/png' }));
    },
  }),
}));
const mockExportData: DashboardExportData = {
  stats: { currentStreak: 5, peakStreak: 10, totalContributions: 100 },
  languages: [],
};

describe('useShareActions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions copy state from loading to success after handleCopyLink', async () => {
    // Verifies the full lifecycle: idle → loading → success on a successful clipboard write
    const { result } = renderHook(() => useShareActions('testuser', mockExportData, vi.fn()));

    await act(async () => {
      await result.current.handleCopyLink();
    });

    expect(result.current.states['copy']).toBe('success');
  });

  it('resets copy state to idle after 2500ms', async () => {
    // Verifies the timeout reset behavior critical for UX — success must not persist forever
    const { result } = renderHook(() => useShareActions('testuser', mockExportData, vi.fn()));

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
      writable: true,
    });

    Object.assign(navigator, {
      clipboard: {
        write: writeMock,
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    document.body.innerHTML = '<div id="dashboard-root">Dashboard</div>';

    const { result } = renderHook(() => useShareActions('testuser', mockExportData, vi.fn()));

    await act(async () => {
      await result.current.handleCopyImage();
    });
    console.log('copyImage state:', result.current.states['copyImage']);
    expect(writeMock).toHaveBeenCalled();
    expect(result.current.states['copyImage']).toBe('success');
  });
});
