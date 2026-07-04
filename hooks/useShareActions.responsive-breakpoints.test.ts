import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

const mockUsername = 'mobile-user';

const mockExportData: DashboardExportData = {
  stats: {
    totalContributions: 125,
    currentStreak: 8,
    peakStreak: 21,
  },
  activity: [],
  languages: [],
};

const mockOnClose = vi.fn();

vi.mock('@/utils/urls', () => ({
  getDashboardUrl: (username: string) => `https://commitpulse.app/dashboard/${username}`,
  getOrigin: () => 'https://commitpulse.app',
}));

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
  toCanvas: vi.fn(),
}));

vi.mock('@/lib/export3d', () => ({
  activityToTowers: vi.fn(),
  generateMonolithSTL: vi.fn(),
}));

function mockClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
    writable: true,
  });
}

describe('useShareActions Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockOnClose.mockReset();
    mockClipboard();

    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports copy link actions correctly on a 375px mobile viewport', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true,
    });

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    let success = false;

    await act(async () => {
      success = await result.current.handleCopyLink();
    });

    expect(window.innerWidth).toBe(375);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(mockUsername)
    );

    expect(success).toBe(true);
    expect(result.current.states.copy).toBe('success');
  });

  it('supports Twitter/X sharing on a 375px mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true,
    });

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    act(() => {
      result.current.handleTwitter();
    });

    expect(window.innerWidth).toBe(375);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener'
    );

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('supports LinkedIn sharing on a 390px mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 390,
      configurable: true,
    });

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    act(() => {
      result.current.handleLinkedIn();
    });

    expect(window.innerWidth).toBe(390);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      'noopener'
    );

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('supports Reddit sharing on a 430px mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 430,
      configurable: true,
    });

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    act(() => {
      result.current.handleReddit();
    });

    expect(window.innerWidth).toBe(430);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('reddit.com/submit'),
      '_blank',
      'noopener,noreferrer'
    );

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('uses the native mobile share API successfully on a 375px viewport', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true,
    });

    const shareMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    await act(async () => {
      await result.current.handleNativeShare();
    });

    expect(window.innerWidth).toBe(375);

    expect(shareMock).toHaveBeenCalledWith({
      title: `${mockUsername}'s Commit Pulse`,
      text: 'Check out my GitHub commit pulse on CommitPulse 🚀',
      url: expect.stringContaining(mockUsername),
    });

    expect(result.current.states.native).toBe('success');
  });
});
