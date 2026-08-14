import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/auth/login', () => {
  it('rejects missing credential fields with 400', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'octocat' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('required');
  });

  it('returns a frontend-ready success payload when identifier and password are present', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'octocat', password: 'password123' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Authentication successful');
    expect(body.user.identifier).toBe('octocat');
  });
});
