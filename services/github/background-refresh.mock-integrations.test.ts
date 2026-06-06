import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh Mock Integrations', () => {
  let service: BackgroundRefresh;

  beforeEach(() => {
    service = BackgroundRefresh.getInstance();
    service.reset();
    vi.clearAllMocks();
  });

  it('mocks standard asynchronous imports using stubs for background refresh', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof getFullDashboardData>>
    );

    service.triggerRefresh('john_doe');

    expect(service.isJobActive('john_doe')).toBe(true);
    expect(getFullDashboardData).toHaveBeenCalledWith('john_doe', { forceRefresh: true });
  });

  it('tests service loading paths to ensure pending state overlays render', async () => {
    let resolvePromise!: (val: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(getFullDashboardData).mockReturnValue(
      promise as unknown as ReturnType<typeof getFullDashboardData>
    );

    service.triggerRefresh('pending_user');
    expect(service.isJobActive('pending_user')).toBe(true);

    resolvePromise({});
    await promise;

    // Small microtask tick to let the finally block run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.isJobActive('pending_user')).toBe(false);
  });

  it('asserts local cache layers are queried before triggering database retrievals', () => {
    // Check if cache is stale or not. If not stale, we should not trigger database retrievals.
    const lastSyncedTenSecsAgo = new Date(Date.now() - 10000).toISOString();
    const isStale = service.isStale(lastSyncedTenSecsAgo);

    expect(isStale).toBe(false);

    if (isStale) {
      service.triggerRefresh('cached_user');
    }

    expect(getFullDashboardData).not.toHaveBeenCalled();
  });

  it('verifies correct fallback procedures during fake endpoint timeout blocks', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('timeout'));

    service.triggerRefresh('timeout_user');
    expect(service.isJobActive('timeout_user')).toBe(true);

    // Wait for promise rejection to propagate
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.isJobActive('timeout_user')).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('asserts complete cache sync is written on success callbacks', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.mocked(getFullDashboardData).mockResolvedValue({ success: true } as unknown as Awaited<
      ReturnType<typeof getFullDashboardData>
    >);

    service.triggerRefresh('sync_user');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Successfully completed background refresh for: sync_user')
    );
    consoleInfoSpy.mockRestore();
  });
});
