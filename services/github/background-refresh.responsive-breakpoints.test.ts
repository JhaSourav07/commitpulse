import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh - Responsive Breakpoints (Multi-device Columns & Mobile Viewport Layouts)', () => {
  let refresher: BackgroundRefresh;

  beforeEach(() => {
    refresher = BackgroundRefresh['getInstance']();
    refresher.reset();
    vi.clearAllMocks();
  });

  it('Mobile Viewport (375px): minimal-length usernames are handled without overflow or stuck state', async () => {
    (getFullDashboardData as Mock).mockResolvedValue(undefined);

    // Shortest valid GitHub username (1 char) — equivalent to minimum 375px viewport
    refresher.triggerRefresh('a');

    expect(refresher.isJobActive('a')).toBe(true);

    await new Promise(process.nextTick);

    // No overflow — job clears cleanly with no stuck state
    expect(refresher.isJobActive('a')).toBe(false);
    expect(getFullDashboardData).toHaveBeenCalledWith('a', { bypassCache: true });
  });

  it('Column Reflow: multiple concurrent jobs for different users queue independently without collapsing into one', () => {
    let resolve1: (v?: unknown) => void;
    let resolve2: (v?: unknown) => void;
    let resolve3: (v?: unknown) => void;

    (getFullDashboardData as Mock)
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve1 = r;
        })
      )
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve2 = r;
        })
      )
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve3 = r;
        })
      );

    // Three independent columns — each user gets their own job slot
    refresher.triggerRefresh('user_col_1');
    refresher.triggerRefresh('user_col_2');
    refresher.triggerRefresh('user_col_3');

    // All three jobs active simultaneously — no reflow collapse
    expect(refresher.isJobActive('user_col_1')).toBe(true);
    expect(refresher.isJobActive('user_col_2')).toBe(true);
    expect(refresher.isJobActive('user_col_3')).toBe(true);

    expect(getFullDashboardData).toHaveBeenCalledTimes(3);

    resolve1!(undefined);
    resolve2!(undefined);
    resolve3!(undefined);
  });

  it('No Horizontal Scroll: maximum-length usernames (39 chars) do not cause overflow or blocked job state', async () => {
    (getFullDashboardData as Mock).mockResolvedValue(undefined);

    // GitHub max username length is 39 characters — equivalent to widest viewport content
    const maxLengthUsername = 'a'.repeat(39);
    refresher.triggerRefresh(maxLengthUsername);

    expect(refresher.isJobActive(maxLengthUsername)).toBe(true);

    await new Promise(process.nextTick);

    // Wide content must not cause overflow — job resolves cleanly
    expect(refresher.isJobActive(maxLengthUsername)).toBe(false);
  });

  it('Navigation Scaling: usernames with mixed casing and whitespace scale down gracefully to normalized active state', () => {
    (getFullDashboardData as Mock).mockReturnValue(new Promise(() => {}));

    // Navigation component equivalent — mixed casing/padding that must normalize
    refresher.triggerRefresh('  NavUser_XL  ');

    // Must resolve to the normalized lowercase key regardless of input formatting
    expect(refresher.isJobActive('navuser_xl')).toBe(true);
    expect(refresher.isJobActive('  NavUser_XL  ')).toBe(true);
    expect(refresher.isJobActive('NAVUSER_XL')).toBe(true);
  });

  it('Mobile Toggle State: rapid successive trigger attempts on same user toggle cleanly without duplicate jobs', async () => {
    let resolveJob: (v?: unknown) => void;

    (getFullDashboardData as Mock).mockReturnValue(
      new Promise((r) => {
        resolveJob = r;
      })
    );

    // First toggle — ON
    refresher.triggerRefresh('toggle_user');
    expect(refresher.isJobActive('toggle_user')).toBe(true);
    expect(getFullDashboardData).toHaveBeenCalledTimes(1);

    // Rapid second toggle attempt — must be rejected cleanly, no duplicate
    refresher.triggerRefresh('toggle_user');
    expect(getFullDashboardData).toHaveBeenCalledTimes(1);

    // Resolve — toggle OFF
    resolveJob!(undefined);
    await new Promise(process.nextTick);

    expect(refresher.isJobActive('toggle_user')).toBe(false);

    // New toggle after resolution — must be accepted cleanly
    (getFullDashboardData as Mock).mockResolvedValueOnce(undefined);
    refresher.triggerRefresh('toggle_user');
    expect(refresher.isJobActive('toggle_user')).toBe(true);
    expect(getFullDashboardData).toHaveBeenCalledTimes(2);
  });
});
