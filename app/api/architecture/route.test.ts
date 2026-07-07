import { expect, test, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock next-auth session to simulate a logged-in user
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'test-user', email: 'test@example.com' } }),
}));

// Mock the github utility dependency
vi.mock('@/lib/github', () => ({
  getGitHubTokens: () => ['mock-token-123'],
}));

test('POST returns 400 if repoUrl is missing', async () => {
  const req = new NextRequest('http://localhost/api/architecture', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  const data = await res.json();
  expect(data.error).toBe('Repository URL is required');
});
