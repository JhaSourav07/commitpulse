import { describe, it, expect, vi } from 'vitest';
import { RefreshPolicy } from './refresh-policy';

describe('RefreshPolicy - Mouse Interactivity & Click Handling', () => {
  it('prevents double-clicks from triggering redundant refresh calls using cooldown cooldownMs validation', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();
    policy.setCooldown(1000);

    const firstCheck = policy.isRefreshAllowed('double-clicker');
    expect(firstCheck).toBe(true);

    policy.recordRefresh('double-clicker');

    // Simulate instant second click (mouse double click)
    const secondCheck = policy.isRefreshAllowed('double-clicker');
    expect(secondCheck).toBe(false);
  });

  it('computes layout offset dimensions for hover tooltip displays correctly', () => {
    const hoverEvent = { clientX: 100, clientY: 200 };
    const getTooltipPosition = (e: { clientX: number; clientY: number }) => ({
      top: e.clientY + 10,
      left: e.clientX + 10,
    });

    const pos = getTooltipPosition(hoverEvent);
    expect(pos.top).toBe(210);
    expect(pos.left).toBe(110);
  });

  it('verifies click handlers call refresh record actions exactly once', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();
    const mockRecord = vi.spyOn(policy, 'recordRefresh');

    const handleRefreshClick = (username: string) => {
      if (policy.isRefreshAllowed(username)) {
        policy.recordRefresh(username);
      }
    };

    handleRefreshClick('click-tester');
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith('click-tester');

    // Subsequent click is blocked, so record is not called again
    handleRefreshClick('click-tester');
    expect(mockRecord).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});
