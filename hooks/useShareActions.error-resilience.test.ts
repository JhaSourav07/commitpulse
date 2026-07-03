import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useShareActions } from './useShareActions';
import { toPng } from 'html-to-image';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
  toCanvas: vi.fn(),
}));

class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => unknown) | null = null;
  postMessage() {}
  terminate() {}
}

describe('useShareActions - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  const username = 'testuser';
  const exportData: DashboardExportData = {
    stats: {
      totalContributions: 100,
      currentStreak: 5,
      peakStreak: 10,
    },
    activity: [{ date: '2024-01-01', count: 5, intensity: 2 }],
    languages: [],
  };
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock browser globals
    globalThis.Worker = MockWorker as unknown as typeof Worker;
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/mock');
    globalThis.URL.revokeObjectURL = vi.fn();

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => cb(0));

    vi.stubGlobal('window', {
      open: vi.fn(),
      document: globalThis.document,
      location: {
        origin: 'http://localhost:3000',
      },
      requestAnimationFrame: (cb: FrameRequestCallback) => cb(0),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('Case 1: verifies hydration stability and initial state mount', () => {
    const { result } = renderHook(() => useShareActions(username, exportData, onClose));

    expect(result.current.states).toEqual({});
    expect(typeof result.current.handleCopyLink).toBe('function');
    expect(typeof result.current.handleDownloadPNG).toBe('function');
    expect(typeof result.current.handleDownloadSVG).toBe('function');
  });

  it('Case 2: verifies clipboard exception safety', async () => {
    // Force writeText to reject
    const clipboardError = new Error('Clipboard access denied');
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(clipboardError);

    const { result } = renderHook(() => useShareActions(username, exportData, onClose));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleCopyLink();
    });

    expect(success).toBe(false);
    expect(result.current.states.copy).toBe('error');
    expect(console.error).toHaveBeenCalledWith(
      '[useShareActions] copy link failed:',
      clipboardError
    );
  });

  it('Case 3: verifies state resets to idle after failures (recovery paths)', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Failed'));

    const { result } = renderHook(() => useShareActions(username, exportData, onClose));

    await act(async () => {
      await result.current.handleCopyLink();
    });

    expect(result.current.states.copy).toBe('error');

    // Fast-forward timers by 2500ms
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.states.copy).toBe('idle');
  });

  it('Case 4: verifies network/database connection resilience on SVG download', async () => {
    const fetchError = new Error('Network timeout');
    const mockFetch = vi.fn().mockRejectedValueOnce(fetchError);
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useShareActions(username, exportData, onClose));

    await act(async () => {
      await result.current.handleDownloadSVG();
    });

    expect(result.current.states.svg).toBe('error');
    expect(console.error).toHaveBeenCalledWith(
      '[useShareActions] SVG download failed:',
      fetchError
    );
  });

  it('Case 5: verifies HTML to PNG conversion exception safety', async () => {
    const pngError = new Error('Failed to generate canvas image');
    vi.mocked(toPng).mockRejectedValueOnce(pngError);

    const { result } = renderHook(() => useShareActions(username, exportData, onClose));

    await act(async () => {
      await result.current.handleDownloadPNG();
    });

    expect(result.current.states.png).toBe('error');
    expect(console.error).toHaveBeenCalledWith('[useShareActions] PNG download failed:', pngError);
  });
});
