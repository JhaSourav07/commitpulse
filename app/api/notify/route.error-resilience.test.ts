import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from './route';

import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import logger from '@/lib/logger';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { gitHubUserValidator } from '@/services/github/validate-user';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Notification', () => ({
  Notification: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCSRF: vi.fn(() => null),
}));

vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({})),
  notifyRateLimiter: {
    checkWithResult: vi.fn().mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    }),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/services/github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({
    verified: true,
  }),
}));

const makeRequest = (method: string, body?: object, query?: string) =>
  new NextRequest(`http://localhost:3000/api/notify${query ? `?${query}` : ''}`, {
    method,
    headers: {
      Authorization: 'Bearer token',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

describe('Notify API error resilience', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env = {
      ...originalEnv,
      MONGODB_URI: 'mongodb://localhost/test',
    };

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    });

    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');

    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);

    vi.mocked(verifyGitHubOwner).mockResolvedValue({
      verified: true,
    });

    vi.mocked(Notification.findOne).mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  it('POST returns 500 when database connection fails', async () => {
    vi.mocked(dbConnect).mockRejectedValueOnce(new Error('Database offline'));

    const res = await POST(
      makeRequest('POST', {
        username: 'octocat',
        email: 'octocat@test.com',
      })
    );

    expect(res.status).toBe(500);

    expect(await res.json()).toEqual({
      success: false,
      message: 'Internal server error.',
    });

    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('POST safely handles Notification.findOne runtime exception', async () => {
    vi.mocked(dbConnect).mockResolvedValue({} as never);

    vi.mocked(Notification.findOne).mockImplementation(() => {
      throw new Error('Mongo exploded');
    });

    const res = await POST(
      makeRequest('POST', {
        username: 'octocat',
        email: 'octocat@test.com',
      })
    );

    expect(res.status).toBe(500);

    expect(await res.json()).toEqual({
      success: false,
      message: 'Internal server error.',
    });

    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('GET returns 500 when database connection fails', async () => {
    vi.mocked(dbConnect).mockRejectedValueOnce(new Error('Connection lost'));

    const res = await GET(makeRequest('GET', undefined, 'user=octocat'));

    expect(res.status).toBe(500);

    expect(await res.json()).toEqual({
      success: false,
      message: 'Internal server error.',
    });

    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('DELETE safely returns 500 when database connection fails', async () => {
    vi.mocked(dbConnect).mockRejectedValueOnce(new Error('Connection lost'));

    const res = await DELETE(makeRequest('DELETE', undefined, 'user=octocat'));

    expect(res.status).toBe(500);

    expect(await res.json()).toEqual({
      success: false,
      message: 'Internal server error.',
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('DELETE safely handles Notification.deleteOne failure', async () => {
    vi.mocked(dbConnect).mockResolvedValue({} as never);

    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'octocat',
      email: 'octocat@test.com',
      managementTokenHash: undefined,
    } as never);

    vi.mocked(Notification.deleteOne).mockRejectedValueOnce(new Error('Unexpected delete failure'));

    const res = await DELETE(makeRequest('DELETE', undefined, 'user=octocat'));

    expect(res.status).toBe(500);

    expect(await res.json()).toEqual({
      success: false,
      message: 'Internal server error.',
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
