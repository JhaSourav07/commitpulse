import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareActions } from './useShareActions';

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
  toCanvas: vi.fn(),
}));

import { toPng, toCanvas } from 'html-to-image';

const mockData = {
  stats: {
    totalContributions: 10,
    currentStreak: 2,
    peakStreak: 5,
  },
  activity: [],
  languages: [],
};

describe('useShareActions error resilience', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
        write: vi.fn(),
      },
      writable: true,
    });
  });

  it('should hydrate without crashing', () => {
    expect(() => renderHook(() => useShareActions('test-user', mockData, onClose))).not.toThrow();
  });

  it('should handle clipboard exception safely', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('clipboard failed'));

    const { result } = renderHook(() => useShareActions('test-user', mockData, onClose));

    let response;

    await act(async () => {
      response = await result.current.handleCopyLink();
    });

    expect(response).toBe(false);

    expect(result.current.states.copy).toBe('error');
  });

  it('should fallback when PNG generation fails', async () => {
    vi.mocked(toPng).mockRejectedValue(new Error('canvas crash'));

    const { result } = renderHook(() => useShareActions('test-user', mockData, onClose));

    await act(async () => {
      await result.current.handleDownloadPNG();
    });

    expect(result.current.states.png).toBe('error');
  });

  it('should recover from SVG fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('server unavailable'));

    const { result } = renderHook(() => useShareActions('test-user', mockData, onClose));

    await act(async () => {
      await result.current.handleDownloadSVG();
    });

    expect(result.current.states.svg).toBe('error');
  });

  it('should handle native share exceptions safely', async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new Error('share failed')),
    });

    const { result } = renderHook(() => useShareActions('test-user', mockData, onClose));

    await act(async () => {
      await result.current.handleNativeShare();
    });

    expect(result.current.states.native).toBe('error');
  });
});
