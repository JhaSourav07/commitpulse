import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/Notification', () => ({
  Notification: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
}));

import { Notification } from '@/models/Notification';

const makeRequest = (method: string, body?: object, search?: string) => {
  const url = `http://localhost:3000/api/notify${search ? '?' + search : ''}`;
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('POST /api/notify', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when username is missing', async () => {
    const res = await POST(makeRequest('POST', { email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest('POST', { username: 'testuser' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await POST(makeRequest('POST', { username: 'testuser', email: 'notanemail' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid frequency', async () => {
    const res = await POST(
      makeRequest('POST', { username: 'testuser', email: 'a@b.com', frequency: 'monthly' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 and saves preferences successfully', async () => {
    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      username: 'testuser',
      email: 'a@b.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const res = await POST(
      makeRequest('POST', {
        username: 'testuser',
        email: 'a@b.com',
        frequency: 'daily',
        preferences: { notifyOnCommit: true, notifyOnStreak: true, notifyOnMilestone: true },
      })
    );
    expect(res.status).toBe(200);
  });
});

describe('GET /api/notify', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when username is missing', async () => {
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null);
    const res = await GET(makeRequest('GET', undefined, 'user=nobody'));
    expect(res.status).toBe(404);
  });

  it('returns 200 with preferences when user exists', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'testuser',
      email: 'a@b.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    const res = await GET(makeRequest('GET', undefined, 'user=testuser'));
    expect(res.status).toBe(200);
  });
});
