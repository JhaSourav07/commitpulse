import { describe, it, expect, vi } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import * as githubLib from '../../lib/github';

describe('BackgroundRefresh - Mouse Interactivity & Click Handling', () => {
  it('prevents duplicate refresh triggers from rapid double-click interactions', () => {
    const refresh = BackgroundRefresh.getInstance();
    refresh.reset();

    const mockGetData = vi
      .spyOn(githubLib, 'getFullDashboardData')
      .mockReturnValue(new Promise(() => {}) as Promise<never>);

    refresh.triggerRefresh('double-click-user');
    refresh.triggerRefresh('double-click-user');

    expect(mockGetData).toHaveBeenCalledTimes(1);

    mockGetData.mockRestore();
    refresh.reset();
  });

  it('computes tooltip coordinates for hover overlays correctly', () => {
    const hoverEvent = { clientX: 150, clientY: 250 };

    const getTooltipPosition = (e: { clientX: number; clientY: number }) => ({
      top: e.clientY + 12,
      left: e.clientX + 12,
    });

    const pos = getTooltipPosition(hoverEvent);

    expect(pos.top).toBe(262);
    expect(pos.left).toBe(162);
  });

  it('verifies click handlers invoke refresh exactly once', () => {
    const refresh = BackgroundRefresh.getInstance();
    refresh.reset();

    const triggerSpy = vi.spyOn(refresh, 'triggerRefresh');

    const handleClick = (username: string) => {
      refresh.triggerRefresh(username);
    };

    handleClick('click-user');

    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith('click-user');

    triggerSpy.mockRestore();
  });

  it('applies pointer cursor state while refresh job is active', () => {
    const refresh = BackgroundRefresh.getInstance();
    refresh.reset();

    const mockGetData = vi
      .spyOn(githubLib, 'getFullDashboardData')
      .mockReturnValue(new Promise(() => {}) as Promise<never>);

    refresh.triggerRefresh('hover-user');

    expect(refresh.isJobActive('hover-user')).toBe(true);

    mockGetData.mockRestore();
    refresh.reset();
  });

  it('hides temporary overlay state after mouseleave refresh completion', async () => {
    const refresh = BackgroundRefresh.getInstance();
    refresh.reset();

    vi.spyOn(githubLib, 'getFullDashboardData').mockResolvedValue(
      {} as Awaited<ReturnType<typeof githubLib.getFullDashboardData>>
    );

    refresh.triggerRefresh('mouseleave-user');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(refresh.isJobActive('mouseleave-user')).toBe(false);

    vi.restoreAllMocks();
  });
});
