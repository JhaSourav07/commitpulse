import { expect, test, vi, describe, it } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Note: Ensure getDirSize is exported in route.ts if you plan to test it directly.
// You can also mock dependencies if needed.
import { getDirSize } from './route'; // Assumes you optionally add `export` to `getDirSize` for the test.

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

describe('[Bug fix] getDirSize — async and early-exit behavior', () => {
  it('excludes .git directory contents from the size total', async () => {
    // Set up a temp dir with a small working tree and a large .git folder.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dirsize-'));
    fs.writeFileSync(path.join(tmpDir, 'small.txt'), 'a'.repeat(100));
    fs.mkdirSync(path.join(tmpDir, '.git'));
    fs.writeFileSync(path.join(tmpDir, '.git', 'large-object'), 'b'.repeat(10_000));

    const size = await getDirSize(tmpDir);
    expect(size).toBe(100); // .git contents excluded

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('stops walking once the running total exceeds the given limit', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dirsize-limit-'));
    fs.writeFileSync(path.join(tmpDir, 'big.txt'), 'x'.repeat(1000));
    fs.writeFileSync(path.join(tmpDir, 'also-big.txt'), 'y'.repeat(1000));

    const size = await getDirSize(tmpDir, 500); // limit lower than either file alone
    expect(size).toBeGreaterThan(500);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
