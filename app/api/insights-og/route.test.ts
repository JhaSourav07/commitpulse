import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('[Bug fix] insights-og respects ?tz=', () => {
  it('accepts a tz query parameter without a validation error', async () => {
    const req = new NextRequest('http://localhost/api/insights-og?user=octocat&tz=Asia/Kolkata');
    const res = await GET(req);
    expect(res.status).not.toBe(400);
  });

  it('returns a 400 Bad Request for an invalid tz value', async () => {
    const req = new NextRequest('http://localhost/api/insights-og?user=octocat&tz=Not/A_Real_Zone');
    const res = await GET(req);
    // Since Zod strictly validates the timezone, we expect it to fail with a 400
    expect(res.status).toBe(400);
  });
});
