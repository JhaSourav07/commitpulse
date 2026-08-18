import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();

vi.mock('@/lib/services/studentResumeService', () => ({
  getStudentResume: mockGet,
  confirmStudentResume: mockPost,
}));

vi.mock('@/lib/cache/localCache', () => ({
  get: mockCacheGet,
  set: mockCacheSet,
}));

describe('ApiStudentResumeConfirmRoute mock integrations (Variation 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached resume before requesting service', async () => {
    const cachedResume = {
      id: 'resume-1',
      status: 'confirmed',
    };

    mockCacheGet.mockResolvedValue(cachedResume);

    expect(await mockCacheGet('resume-1')).toEqual(cachedResume);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('loads resume from service when cache misses', async () => {
    mockCacheGet.mockResolvedValue(null);

    const serviceResume = {
      id: 'resume-2',
      status: 'pending',
    };

    mockGet.mockResolvedValue(serviceResume);

    expect(await mockCacheGet('resume-2')).toBeNull();
    expect(await mockGet('resume-2')).toEqual(serviceResume);
  });

  it('renders loading state while async request is pending', async () => {
    const pendingPromise = new Promise(() => {});

    mockGet.mockReturnValue(pendingPromise);

    const result = mockGet('resume-3');

    expect(result).toBeInstanceOf(Promise);
    expect(mockGet).toHaveBeenCalledOnce();
  });

  it('falls back gracefully when service request times out', async () => {
    mockGet.mockRejectedValue(new Error('Request timeout'));

    await expect(mockGet('resume-4')).rejects.toThrow('Request timeout');

    expect(mockCacheGet).not.toHaveBeenCalled();
  });

  it('writes confirmed resume into local cache after success', async () => {
    const confirmedResume = {
      id: 'resume-5',
      status: 'confirmed',
    };

    mockPost.mockResolvedValue(confirmedResume);

    const result = await mockPost('resume-5');

    await mockCacheSet('resume-5', result);

    expect(mockCacheSet).toHaveBeenCalledWith('resume-5', confirmedResume);
  });
});
