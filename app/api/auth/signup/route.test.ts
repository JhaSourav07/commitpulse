import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/auth/signup', () => {
  it('rejects incomplete signup payloads with 400', async () => {
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Octo Cat' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('required');
  });

  it('creates a success response body for a complete POST payload', async () => {
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Octo Cat',
        email: 'octocat@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Account created');
    expect(body.user.fullName).toBe('Octo Cat');
    expect(body.user.email).toBe('octocat@example.com');
  });
});
