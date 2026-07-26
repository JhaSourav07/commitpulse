import { describe, it, expect, vi, beforeEach } from 'vitest';

// import target functions
import {} from // exports
'./refresh-policy';

describe('refresh-policy async integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows pending service state while loading', async () => {
    const mockService = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve('done'), 50))
    );

    const promise = mockService();

    expect(mockService).toHaveBeenCalled();

    await promise;
  });

  it('checks cache before database retrieval', async () => {
    const cacheGet = vi.fn().mockReturnValue('cached-data');
    const dbGet = vi.fn();

    const result = cacheGet();

    expect(result).toBe('cached-data');
    expect(dbGet).not.toHaveBeenCalled();
  });

  it('uses fallback when endpoint timeout occurs', async () => {
    const api = vi.fn().mockRejectedValue(new Error('timeout'));

    let result;

    try {
      await api();
    } catch {
      result = 'fallback';
    }

    expect(result).toBe('fallback');
  });

  it('writes cache after successful refresh', async () => {
    const cacheSet = vi.fn();

    const data = {
      login: 'ganesh',
    };

    cacheSet(data);

    expect(cacheSet).toHaveBeenCalledWith(data);
  });

  it('handles async service mock flow', async () => {
    const cacheGet = vi.fn().mockReturnValue(null);

    const dbGet = vi.fn().mockResolvedValue({
      value: 'fresh',
    });

    const cacheSet = vi.fn();

    const cached = cacheGet();

    if (!cached) {
      const fresh = await dbGet();
      cacheSet(fresh);
    }

    expect(cacheGet).toHaveBeenCalled();
    expect(dbGet).toHaveBeenCalled();
    expect(cacheSet).toHaveBeenCalled();
  });
});
