import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundRefresh } from './background-refresh';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn().mockResolvedValue({}),
}));

function freshInstance(): BackgroundRefresh {
  // Reset the private static so getInstance() constructs a new object
  (BackgroundRefresh as unknown as { instance: BackgroundRefresh | undefined }).instance =
    undefined;
  return BackgroundRefresh.getInstance();
}

// Fixed "now" anchored to 2024-03-10T12:00:00.000Z — this is the US DST
// spring-forward day (clocks moved forward at 02:00 EST → 03:00 EDT), which makes it the ideal anchor for DST boundary assertions.
const NOW_ISO = '2024-03-10T12:00:00.000Z';
const NOW_MS = new Date(NOW_ISO).getTime(); // 1710072000000

// STALE_THRESHOLD_MS = 10 * 60 * 1000 = 600_000 ms (from source)
const THRESHOLD_MS = 10 * 60 * 1000;

describe('BackgroundRefresh — Timezone Normalization & Calendar Data Boundary Alignment', () => {
  let instance: BackgroundRefresh;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW_ISO));
    instance = freshInstance();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    instance.reset();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────
  // UTC suffix (Z): a timestamp 9 minutes ago must NOT be stale.
  // 9 min = 540_000 ms < 600_000 ms threshold.
  it('treats a UTC-suffixed timestamp 9 minutes ago as not stale', () => {
    // 2024-03-10T11:51:00.000Z is exactly 9 minutes before NOW
    const nineMinutesAgoUTC = new Date(NOW_MS - 9 * 60 * 1000).toISOString();

    expect(instance.isStale(nineMinutesAgoUTC)).toBe(false);
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  // EST offset (-05:00): the same UTC moment re-expressed in Eastern Standard
  // Time must resolve to an identical staleness result, confirming that the parser correctly normalises the offset before comparing.
  it('correctly normalises an EST (-05:00) offset and marks a 9-minute-old entry as not stale', () => {
    // 2024-03-10T11:51:00Z == 2024-03-10T06:51:00-05:00
    const nineMinutesAgoEST = '2024-03-10T06:51:00-05:00';

    // Sanity-check: both representations decode to the same epoch ms
    expect(new Date(nineMinutesAgoEST).getTime()).toBe(NOW_MS - 9 * 60 * 1000);

    expect(instance.isStale(nineMinutesAgoEST)).toBe(false);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  // IST offset (+05:30): the same UTC moment expressed in Indian Standard Time.
  // Half-hour offsets are less common; this guards against off-by-one in minute arithmetic when the offset is not a whole hour.
  it('correctly normalises an IST (+05:30) offset and marks a 9-minute-old entry as not stale', () => {
    // 2024-03-10T11:51:00Z == 2024-03-10T17:21:00+05:30
    const nineMinutesAgoIST = '2024-03-10T17:21:00+05:30';

    expect(new Date(nineMinutesAgoIST).getTime()).toBe(NOW_MS - 9 * 60 * 1000);

    expect(instance.isStale(nineMinutesAgoIST)).toBe(false);
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────
  // JST offset (+09:00): a timestamp 11 minutes ago expressed in Japan Standard
  // Time must be considered stale (11 min = 660_000 ms > 600_000 ms threshold).
  it('correctly normalises a JST (+09:00) offset and marks an 11-minute-old entry as stale', () => {
    // 2024-03-10T11:49:00Z == 2024-03-10T20:49:00+09:00  (11 min before NOW)
    const elevenMinutesAgoJST = '2024-03-10T20:49:00+09:00';

    expect(new Date(elevenMinutesAgoJST).getTime()).toBe(NOW_MS - 11 * 60 * 1000);

    expect(instance.isStale(elevenMinutesAgoJST)).toBe(true);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────
  // Leap year boundary (Feb 29 2024) + DST transition context:
  //   • Confirms that Feb 29 parses without throwing (no gap in the grid).
  //   • The DST spring-forward in US/Eastern occurred at 02:00 EST on 2024-03-10 — exactly our NOW anchor — so a lastSyncedAt anchored to the spring-forward moment (2024-03-10T02:00:00-05:00, i.e. the last second before the clock jumped) is always stale relative to noon UTC on the same day (~10 hours elapsed >> 600_000 ms threshold).
  //   • Two sub-assertions guard both boundary types in one test.
  it('parses a Feb 29 leap-year date without error and marks it stale; also marks the DST spring-forward moment as stale', () => {
    // ── Leap year sub-assertion ──────────────────────────────────────────────
    // 2024-02-29T23:55:00Z is ~9.5 days before NOW — unambiguously stale.
    const leapDayTimestamp = '2024-02-29T23:55:00Z';
    const leapDayMs = new Date(leapDayTimestamp).getTime();

    // Confirm the date parsed to a real epoch value (not NaN), meaning the leap-year date did not cause a parse error that would trigger the catch.
    expect(Number.isFinite(leapDayMs)).toBe(true);
    expect(NOW_MS - leapDayMs).toBeGreaterThan(THRESHOLD_MS);
    expect(instance.isStale(leapDayTimestamp)).toBe(true);

    // ── DST transition sub-assertion ─────────────────────────────────────────
    // The exact spring-forward moment in US/Eastern: clocks skipped from 02:00 EST to 03:00 EDT on 2024-03-10, so 2024-03-10T02:00:00-05:00 (= 2024-03-10T07:00:00Z) is ~5 hours before our NOW anchor.
    const dstTransitionTimestamp = '2024-03-10T02:00:00-05:00';
    const dstMs = new Date(dstTransitionTimestamp).getTime();

    expect(Number.isFinite(dstMs)).toBe(true);
    expect(NOW_MS - dstMs).toBeGreaterThan(THRESHOLD_MS);
    expect(instance.isStale(dstTransitionTimestamp)).toBe(true);
  });
});
